# 🎯 Linera Quick Reference for Drawn

> **TL;DR:** Everything you need to know about your Linera setup in one page

---

## 🏗️ What You're Working With

### Your Tech Stack

```
Linera Blockchain (v0.15.5-0.15.7)
    │
    ├─ Backend: Rust WebAssembly Contracts
    │   ├─ contract.rs (write operations)
    │   ├─ service.rs (read operations)
    │   ├─ state.rs (data storage)
    │   └─ lib.rs (types & schemas)
    │
    ├─ API Layer: GraphQL (Auto-generated from Rust)
    │   └─ http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>
    │
    └─ Frontend: React + Vite + TypeScript
        └─ Calls GraphQL for all blockchain interactions
```

### Current State: Single-Chain Tic-Tac-Toe

```rust
✅ Working:
- CreateGame(player_x, player_o) → Creates game on single chain
- MakeMove(game_id, player, position) → Updates game state
- Queries: game(id), playerStats(address), totalGames()

❌ Missing for Multiplayer:
- Cross-chain messaging
- Event streams
- Multiple player chains
- Real-time sync
```

---

## 🔄 The Flow: Contract → GraphQL → Frontend

```
┌──────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (React)                                          │
│    - User clicks "Make Move"                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ HTTP POST
                     │ { query: "mutation { makeMove(...) }" }
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. GRAPHQL SERVICE (port 8080)                               │
│    - Receives mutation request                               │
│    - Routes to contract                                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Calls execute_operation()
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. CONTRACT (contract.rs)                                    │
│    - Validates move                                          │
│    - Updates state.games                                     │
│    - Returns OperationResponse                               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Persists to blockchain
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. STATE (state.rs)                                          │
│    - games: MapView<u64, Game>                               │
│    - Data stored in RocksDB                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Response
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. BACK TO FRONTEND                                          │
│    - { data: { makeMove: "MoveMade" } }                      │
│    - UI updates game board                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Commands

### Local Development (Current)

```bash
# 1. Start Linera network
./run.bash

# This script does:
linera net up --with-faucet               # Start local network
linera wallet init --faucet=http://...   # Create wallet
linera wallet request-chain              # Get a chain
cargo build --release --target wasm32    # Build contract
linera publish-bytecode ...              # Deploy contract
linera create-application $BYTECODE_ID   # Create app instance
linera service --port 8080               # Start GraphQL server

# Frontend runs on port 5173/8080
# GraphQL API: http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>
```

### Multiplayer Deployment (Future)

```bash
# Create 2 player wallets + 1 shared PLAY_CHAIN
export LINERA_WALLET_1="$TMP/wallet_1.json"
export LINERA_WALLET_2="$TMP/wallet_2.json"

# Player 1 chain
linera --with-wallet 1 wallet init --faucet="$FAUCET_URL"
USER_CHAIN_1=$(linera --with-wallet 1 wallet request-chain --faucet="$FAUCET_URL")

# Player 2 chain
linera --with-wallet 2 wallet init --faucet="$FAUCET_URL"
USER_CHAIN_2=$(linera --with-wallet 2 wallet request-chain --faucet="$FAUCET_URL")

# Shared game chain
PLAY_CHAIN=$(linera --with-wallet 1 wallet request-chain --faucet="$FAUCET_URL")

# Deploy app to all chains
linera --with-wallet 1 publish-bytecode ...
linera --with-wallet 1 create-application $BYTECODE_ID  # On USER_CHAIN_1
linera --with-wallet 2 create-application $BYTECODE_ID  # On USER_CHAIN_2

# Start services
linera --with-wallet 1 service --port 8081  # Player 1 GraphQL
linera --with-wallet 2 service --port 8082  # Player 2 GraphQL
```

---

## 📡 GraphQL Examples

### Mutations (Write Operations)

```graphql
# Create a new game
mutation {
  createGame(playerX: "0xabc123...", playerO: "0xdef456...")
}

# Make a move
mutation {
  makeMove(
    gameId: 1
    player: "0xabc123..."
    position: 4 # Center position
  )
}
```

### Queries (Read Operations)

```graphql
# Get game state
query {
  game(gameId: 1) {
    gameId
    playerX
    playerO
    board
    currentTurn
    status
    winner
  }
}

# Get player stats
query {
  playerStats(address: "0xabc123...") {
    gamesPlayed
    gamesWon
    gamesLost
    gamesDrawn
  }
}

# Get totals
query {
  totalGames
  nextGameId
}
```

---

## 🔥 Common Issues & Fixes

### Issue: "client is not configured to propose on chain"

**Cause:** Trying to subscribe before bytecode is on the chain

**Fix:**

```rust
// ❌ WRONG ORDER
self.runtime.subscribe_to_events(...);  // Fails!
self.runtime.prepare_message(msg).send_to(chain);

// ✅ CORRECT ORDER
self.runtime.prepare_message(msg).send_to(chain);  // Bytecode propagates
// ... wait for confirmation ...
self.runtime.subscribe_to_events(...);  // Now works!
```

### Issue: Can't extract CHAIN_ID

**Fix:**

```bash
# Use this pattern (works v0.15.5-0.15.7)
CHAIN_ID=$(linera wallet show | grep -E '^[a-f0-9]{64}$' | head -1)
```

### Issue: GraphQL endpoint 404

**Check:**

```bash
# Service running?
ps aux | grep "linera.*service"

# Correct URL format:
http://localhost:8080/chains/<64-hex-chars>/applications/<64-hex-chars>

# Test with curl:
curl -X POST http://localhost:8080/chains/$CHAIN_ID/applications/$APP_ID \
  -H "Content-Type: application/json" \
  -d '{"query": "{ totalGames }"}'
```

### Issue: Frontend shows stale data

**Fix:**

```typescript
// Add delay after mutations for cross-chain messages
await makeMove(gameId, position);
await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s
await fetchGameState();
```

---

## 📚 Key Files to Know

### Backend (contracts/src/)

```
lib.rs          → Types, enums, GraphQL schema
contract.rs     → Business logic (execute_operation)
service.rs      → Read queries (handle_query)
state.rs        → Data storage (RootView)
Cargo.toml      → Dependencies
```

### Frontend (frontend/src/)

```
App.tsx         → Main app, routing
components/     → Reusable UI components
pages/          → Page components
hooks/          → Custom React hooks (where you'll add GraphQL calls)
```

### Deployment

```
run.bash        → Local deployment script
compose.yaml    → Docker configuration
Dockerfile      → Container build
```

---

## 🎯 Multiplayer Patterns (from linot)

### Chain Separation

```
USER_CHAIN (each player has one)
├─ Operations: Subscribe, JoinGame, MakeMove (sends messages)
├─ State: my_game, user_status, my_hand
└─ Queries: myHand(owner), userStatus

PLAY_CHAIN (shared authoritative state)
├─ Messages: RequestJoin, MakeMoveAction (receives from USER_CHAINs)
├─ State: all_games, all_players, game_boards
├─ Events: GameUpdate, TurnChanged, GameEnded (broadcasts to subscribers)
└─ Queries: game(id), allPlayers
```

### Message Flow

```
1. Player 1: Operation::JoinGame on USER_CHAIN_1
             ↓
2. USER_CHAIN_1: Send Message::RequestJoin → PLAY_CHAIN
             ↓
3. PLAY_CHAIN: Process join, send Message::JoinConfirmed → USER_CHAIN_1
             ↓
4. USER_CHAIN_1: Receive confirmation → Subscribe to events
             ↓
5. PLAY_CHAIN: Emit GameEvent::PlayerJoined
             ↓
6. All subscribed USER_CHAINs receive event → Update local state
```

---

## 🔗 Resources

### Documentation

- **Linera Docs:** https://linera.dev/developers
- **Getting Started:** https://linera.dev/developers/getting_started/installation.html
- **Core Concepts:** https://linera.dev/developers/core_concepts.html
- **Frontend Guide:** https://linera.dev/developers/frontend.html

### Example Projects (in your inspo/ folder)

- **linot-card-game:** Best for multiplayer patterns, event streams
- **microcard:** Complex game logic, multiple chains
- **microchess:** Turn-based games

### Your Docs (just created!)

- **docs/LINERA_INTEGRATION_COMPLETE_GUIDE.md** - Full deep dive
- **docs/BACKEND_ANALYSIS.md** - Current state + migration plan
- **FRONTEND_BACKEND_INTEGRATION.md** - API integration guide

---

## ✅ Next Actions

1. **Understand current setup** ✅ (You're here!)
2. **Review linot patterns** → See `inspo/linot-card-game/docs/WORKING_FLOW_BACKEND.md`
3. **Plan multiplayer migration** → See `docs/BACKEND_ANALYSIS.md`
4. **Implement cross-chain messaging** → Follow phases in analysis doc
5. **Update frontend** → Add multi-endpoint support
6. **Test locally** → 2 players, 1 PLAY_CHAIN
7. **Deploy with Docker** → Use updated run.bash

---

**Questions?** Check the comprehensive guides in the `docs/` folder!
