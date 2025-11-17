# Contracts (Linera + Rust)

This folder contains Rust smart contracts for the Linera blockchain.

## Contract Structure

The Drawn application implements an NFT sticker game with the following features:

- **NFT Minting** — Mint unique sticker NFTs with metadata URIs (IPFS/Pinata)
- **Gameplay State** — Track player scores and sticker collections
- **Rewards System** — Allocate and claim rewards based on gameplay

## Files

- `Cargo.toml` — Rust dependencies and build configuration
- `src/lib.rs` — ABI definition and operations (mutations)
- `src/state.rs` — Application state (NFTs, players, scores, rewards)
- `src/contract.rs` — Contract logic (business layer, state mutations)
- `src/service.rs` — GraphQL service (read-only query layer)

## Prerequisites

Install Rust toolchain:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

Install Linera CLI (follow official docs):

```bash
# See https://linera.dev for the latest installation instructions
```

## Quick Start

### 1. Build the Contract

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

This creates two WASM files:
- `target/wasm32-unknown-unknown/release/drawn_contract.wasm`
- `target/wasm32-unknown-unknown/release/drawn_service.wasm`

### 2. Run Tests

```bash
cargo test
```

### 3. Deploy to Testnet

Initialize wallet and request a chain:

```bash
# Initialize wallet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Request a new chain with tokens
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
```

Deploy the application:

```bash
linera publish-and-create \
  target/wasm32-unknown-unknown/release/drawn_{contract,service}.wasm
```

Note: This contract doesn't require initialization arguments (uses `()`).

### 4. Start Node Service

```bash
linera service --port 8080
```

### 5. Interact via GraphQL

Navigate to: `http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>`

Example queries:

```graphql
# Query total minted stickers
query {
  totalMinted
  nextTokenId
}

# Get a specific sticker
query {
  sticker(tokenId: 1) {
    tokenId
    owner
    metadataUri
    stickerType
    mintedAt
  }
}

# Get player data
query {
  player(address: "alice") {
    address
    totalScore
    stickersOwned
    pendingRewards
  }
}

# Get all stickers owned by a player
query {
  playerStickers(address: "alice") {
    tokenId
    metadataUri
    stickerType
  }
}
```

Example mutations:

```graphql
# Mint a new sticker
mutation {
  mintSticker(
    owner: "alice"
    metadataUri: "ipfs://QmXxx..."
    stickerType: "rare"
  )
}

# Update player score
mutation {
  updateScore(tokenId: 1, score: 100)
}

# Allocate rewards
mutation {
  allocateReward(player: "alice", amount: 50)
}
```

## Operations

The contract supports the following operations:

1. **MintSticker** — Mint a new NFT sticker
   - Creates a unique token with metadata URI
   - Assigns ownership to a player
   - Updates player's sticker collection

2. **UpdateScore** — Update gameplay score for a token
   - Adds score to player's total
   - Automatically allocates rewards (1:1 ratio)

3. **AllocateReward** — Manually allocate rewards to a player
   - Admin function to distribute rewards

4. **ClaimRewards** — Claim pending rewards
   - Player can claim accumulated rewards
   - Note: Caller authentication needs enhancement

## Architecture

**Contract** (`contract.rs`):
- Executes operations and modifies state
- Runs in a secure, sandboxed environment
- Creates blocks on the blockchain

**Service** (`service.rs`):
- Provides read-only access to state
- Exposes GraphQL API for queries
- Runs on the node service

Both are compiled to WebAssembly and deployed together.

## State Management

The application uses Linera's view system:

- `RegisterView<u64>` — Single value storage (counters)
- `MapView<K, V>` — Key-value storage (stickers, players)

All state persists across sessions and is replicated across validators.

## Next Steps

1. Add authentication for ClaimRewards operation
2. Implement cross-chain messaging for multi-chain gameplay
3. Add events for minting/scoring/rewards
4. Implement sticker trading between players
5. Add rarity tiers and collection mechanics
6. Integrate with IPFS/Pinata for metadata storage

## Useful Commands

```bash
# Build for WASM
cargo build --release --target wasm32-unknown-unknown

# Run tests
cargo test

# Check code
cargo check

# Format code
cargo fmt

# Lint code
cargo clippy

# Show wallet status
linera wallet show

# Sync with network
linera sync

# Query chain balance
linera query-balance
```

## Resources

- [Linera Developer Documentation](https://linera.dev/)
- [Linera SDK Documentation](https://docs.rs/linera-sdk)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Linera GitHub Repository](https://github.com/linera-io/linera-protocol)
