# Drawn - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Container                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     Frontend (Port 5173)                    │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │        Next.js + Tailwind + React                    │  │ │
│  │  │  - Contract Dashboard                                │  │ │
│  │  │  - Stats Display                                     │  │ │
│  │  │  - GraphiQL Link                                     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│                              │ GraphQL Queries                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Linera Node Service (Port 8080)               │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │                  GraphQL API                         │ │ │
│  │  │  - Query: totalMinted, nextTokenId                  │ │ │
│  │  │  - Mutations: mintSticker, updateScore, etc.        │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│                              │ Contract Calls                    │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Drawn Smart Contract                      │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Contract (contract.rs) - Business Logic            │ │ │
│  │  │  ┌────────────────────────────────────────────────┐ │ │ │
│  │  │  │ Operations:                                    │ │ │ │
│  │  │  │  • MintSticker(owner, uri, type)               │ │ │ │
│  │  │  │  • UpdateScore(tokenId, score)                 │ │ │ │
│  │  │  │  • AllocateReward(player, amount)              │ │ │ │
│  │  │  │  • ClaimRewards()                              │ │ │ │
│  │  │  └────────────────────────────────────────────────┘ │ │ │
│  │  │                                                      │ │ │
│  │  │  State (state.rs) - Data Persistence               │ │ │
│  │  │  ┌────────────────────────────────────────────────┐ │ │ │
│  │  │  │ • next_token_id: RegisterView<u64>             │ │ │ │
│  │  │  │ • stickers: MapView<u64, Sticker>              │ │ │ │
│  │  │  │ • players: MapView<String, PlayerData>         │ │ │ │
│  │  │  │ • total_minted: RegisterView<u64>              │ │ │ │
│  │  │  └────────────────────────────────────────────────┘ │ │ │
│  │  │                                                      │ │ │
│  │  │  Service (service.rs) - Read-only Queries          │ │ │
│  │  │  ┌────────────────────────────────────────────────┐ │ │ │
│  │  │  │ • totalMinted() -> u64                         │ │ │ │
│  │  │  │ • nextTokenId() -> u64                         │ │ │ │
│  │  │  └────────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                  │
│                               │ State Updates                    │
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Linera Local Network (Ports 9001, 13001)         │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  • Validator                                         │ │ │
│  │  │  • Faucet (http://localhost:8080)                   │ │ │
│  │  │  • Chain & Block Storage                            │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Mint Sticker Flow
```
User → Frontend → GraphQL Mutation → Contract.execute_operation() 
  → State.stickers.insert() → State.players.update() → Block Created
```

### 2. Query Stats Flow
```
User → Frontend → GraphQL Query → Service.handle_query() 
  → State.total_minted.get() → Response
```

### 3. Update Score Flow
```
User → GraphQL Mutation → Contract.execute_operation() 
  → State.get_sticker() → State.players.update() 
  → Auto-allocate rewards (1:1) → Block Created
```

## Port Mapping

| Port  | Service                    | Purpose                          |
|-------|----------------------------|----------------------------------|
| 5173  | Next.js Frontend           | User interface                   |
| 8080  | Linera Node Service        | GraphQL API + Faucet             |
| 9001  | Validator Proxy            | Internal network communication   |
| 13001 | Validator                  | Blockchain consensus             |

## Deployment Flow (run.bash)

```
1. Start local network
   └─> linera net up --with-faucet

2. Initialize wallet
   └─> linera wallet init

3. Request chain with tokens
   └─> linera wallet request-chain

4. Build contract (Rust → WASM)
   └─> cargo build --target wasm32-unknown-unknown

5. Publish bytecode
   └─> linera publish-bytecode drawn_{contract,service}.wasm

6. Create application instance
   └─> linera create-application <bytecode-id>

7. Start node service
   └─> linera service --port 8080

8. Start frontend
   └─> pnpm dev --port 5173
```

## File Structure

```
Drawn/
├── contracts/
│   ├── src/
│   │   ├── lib.rs          # ABI + Operation enum
│   │   ├── state.rs        # State management (Views)
│   │   ├── contract.rs     # Business logic + tests
│   │   └── service.rs      # GraphQL service
│   └── Cargo.toml          # Rust dependencies
├── frontend/
│   ├── pages/
│   │   ├── _app.js         # App wrapper
│   │   └── index.js        # Main dashboard
│   ├── styles/
│   │   └── globals.css     # Tailwind imports
│   └── package.json        # Node dependencies
├── Dockerfile              # Container setup
├── compose.yaml            # Docker Compose config
└── run.bash               # Deployment script
```

## Technology Stack

### Smart Contract
- **Language**: Rust 1.86
- **Framework**: Linera SDK 0.15.5
- **Build Target**: wasm32-unknown-unknown
- **Testing**: cargo test
- **State**: RegisterView, MapView

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS 3.4
- **Package Manager**: pnpm
- **Port**: 5173

### Infrastructure
- **Container**: Docker
- **Orchestration**: Docker Compose
- **Network**: Linera localnet
- **API**: GraphQL (via Linera service)

## State Schema

### Sticker
```rust
struct Sticker {
    token_id: u64,
    owner: String,
    metadata_uri: String,
    sticker_type: String,
    minted_at: u64,
}
```

### PlayerData
```rust
struct PlayerData {
    address: String,
    total_score: u64,
    stickers_owned: Vec<u64>,
    pending_rewards: u64,
}
```

## GraphQL Schema

### Queries
```graphql
type Query {
  totalMinted: Int!
  nextTokenId: Int!
}
```

### Mutations
```graphql
type Mutation {
  mintSticker(owner: String!, metadataUri: String!, stickerType: String!): Int!
  updateScore(tokenId: Int!, score: Int!): Boolean!
  allocateReward(player: String!, amount: Int!): Boolean!
  claimRewards: Int!
}
```

## Security Considerations

1. **Owner Authentication**: Currently uses string addresses - should be enhanced with proper Linera address verification
2. **Access Control**: Admin operations (allocateReward) should verify caller permissions
3. **Input Validation**: Metadata URIs should follow IPFS standards
4. **Reward Claims**: ClaimRewards needs caller authentication implementation

## Future Enhancements

1. **Enhanced Queries**: Add sticker lookup and player data queries
2. **Events**: Emit events for minting, scoring, rewards
3. **Cross-Chain**: Enable sticker trading across chains
4. **Collections**: Group stickers into sets with completion bonuses
5. **Marketplace**: Add sticker trading between players
6. **Achievements**: Track player milestones and badges
