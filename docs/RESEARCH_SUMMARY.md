# 📋 Research Summary: Linera Integration for Drawn

> **Completed:** January 10, 2026  
> **Status:** ✅ Comprehensive analysis complete

---

## 🎯 What Was Researched

### 1. **Your Current Drawn Contract** ✅

- Analyzed all 4 core files: lib.rs, contract.rs, service.rs, state.rs
- **Finding:** Single-chain Tic-Tac-Toe working correctly
- **Gap:** No cross-chain messaging or multiplayer architecture

### 2. **Reference Projects** ✅

- **linot-card-game**: Best multiplayer patterns, event streams, subscribe pattern
- **microcard**: Complex game logic with multiple chain types
- **microchess**: Turn-based game architecture
- **Key Learning:** All use USER_CHAIN + PLAY_CHAIN separation

### 3. **Linera Architecture** ✅

- Microchains: Each player gets own chain
- Cross-chain messages: Async communication between chains
- Bytecode propagation: First message to a chain auto-registers app
- GraphQL: Auto-generated from Rust types

### 4. **Local Deployment** ✅

- Studied run.bash scripts from all reference projects
- Wallet setup patterns (multiple wallets for multiplayer)
- Service startup (different ports for each player)
- Chain synchronization requirements

### 5. **GraphQL Integration** ✅

- How Operations → Mutations (write)
- How Service → Queries (read)
- Frontend patterns for calling GraphQL
- Event subscription mechanisms

---

## 📊 Key Findings

### How Linera Works (The Flow)

```
DEPLOYMENT:
run.bash → linera net up → publish bytecode → create app → linera service

CONTRACT EXECUTION:
Frontend → GraphQL → Service → Contract → State → Blockchain

MULTIPLAYER:
USER_CHAIN_1 ─┐
              ├─ Messages ─→ PLAY_CHAIN ─→ Events ─→ All subscribers
USER_CHAIN_2 ─┘
```

### The Critical Pattern (From linot)

**Wrong Way (Causes errors):**

```rust
subscribe(PLAY_CHAIN)  // ❌ Fails - no bytecode yet!
send_message(...)      // Too late
```

**Right Way (Works):**

```rust
send_message(PLAY_CHAIN)  // ✅ Bytecode propagates
// ... wait for confirmation ...
subscribe(PLAY_CHAIN)     // ✅ Now has bytecode
```

### Your Backend Architecture (Current vs Needed)

**Current:**

```rust
Operation::CreateGame → Executed on single chain
Operation::MakeMove → Processed locally
No messages, no events, no multi-chain
```

**Needed:**

```rust
Message enum → Cross-chain communication
GameEvent enum → Real-time updates
UserStatus → Track player state
execute_message() → Handle incoming messages
Event streams → Broadcast game updates
```

---

## 📁 Documentation Created

### 1. **LINERA_INTEGRATION_COMPLETE_GUIDE.md** (6,500 words)

**Sections:**

- Understanding Linera Architecture
- Your Current Setup Analysis
- Contract → GraphQL → Frontend Flow
- Multiplayer Chain Architecture
- Local Deployment Workflow
- GraphQL Mutations & Queries
- Frontend Integration Patterns
- Common Pitfalls & Solutions

**Key Content:**

- Complete code examples for all patterns
- Diagrams showing data flow
- Version-specific differences (v0.15.5-0.15.7)
- Step-by-step implementation guides

### 2. **BACKEND_ANALYSIS.md** (4,000 words)

**Sections:**

- Current Backend Architecture
- Architecture Comparison (Single vs Multi-chain)
- Detailed Comparison with linot
- What You Need to Add (Message, Event, UserStatus enums)
- Complete implementation handlers
- Phase-by-phase migration plan

**Key Content:**

- Side-by-side code comparisons
- Missing components highlighted
- Detailed handler implementations
- Migration roadmap

### 3. **QUICK_START_LINERA.md** (Quick Reference)

**Sections:**

- TL;DR of your tech stack
- The flow in one diagram
- Deployment commands (current + future)
- GraphQL examples
- Common issues & fixes
- Key files to know
- Multiplayer patterns

**Key Content:**

- Copy-paste commands
- Quick troubleshooting
- Essential patterns only
- Resource links

---

## 🔍 How Your Backend Works Now

### Current Architecture

```rust
┌─────────────────────────────────────────────────┐
│ lib.rs (Types)                                  │
│                                                  │
│ pub enum Operation {                            │
│     CreateGame { player_x, player_o },          │
│     MakeMove { game_id, player, position }      │
│ }                                                │
│                                                  │
│ pub struct Game {                                │
│     game_id, player_x, player_o, board,         │
│     current_turn, status, winner                │
│ }                                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ contract.rs (Business Logic)                    │
│                                                  │
│ execute_operation(Operation) {                  │
│     match operation {                           │
│         CreateGame { .. } => {                  │
│             // Create game on THIS chain        │
│             state.games.insert(game_id, game)   │
│         }                                        │
│         MakeMove { .. } => {                    │
│             // Validate move                    │
│             // Update board                     │
│             // Check winner                     │
│         }                                        │
│     }                                            │
│ }                                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ state.rs (Data Storage)                         │
│                                                  │
│ pub struct TicTacToeState {                     │
│     next_game_id: RegisterView<u64>,            │
│     games: MapView<u64, Game>,                  │
│     player_stats: MapView<String, PlayerStats>, │
│     total_games: RegisterView<u64>              │
│ }                                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ service.rs (GraphQL Queries)                    │
│                                                  │
│ #[Object]                                        │
│ impl QueryRoot {                                │
│     async fn game(&self, game_id: u64) {        │
│         self.state.get_game(game_id).await      │
│     }                                            │
│     async fn total_games(&self) { ... }         │
│ }                                                │
└─────────────────────────────────────────────────┘
```

**What Works:**
✅ Single player vs AI
✅ Two players on same chain
✅ Game logic (win detection, turn validation)
✅ Player statistics
✅ GraphQL queries and mutations

**What's Missing:**
❌ Cross-chain messaging
❌ Event streams for real-time updates
❌ Proper multiplayer (each player on own chain)
❌ Subscription mechanism
❌ PLAY_CHAIN vs USER_CHAIN separation

---

## 🎮 How Multiplayer Should Work

### Target Architecture (From linot pattern)

```
┌───────────────────────┐         ┌───────────────────────┐
│   USER_CHAIN_1        │         │   USER_CHAIN_2        │
│   (Player 1)          │         │   (Player 2)          │
│                       │         │                       │
│   State:              │         │   State:              │
│   - my_game_id        │         │   - my_game_id        │
│   - user_status       │         │   - user_status       │
│   - subscribed_chain  │         │   - subscribed_chain  │
│                       │         │                       │
│   Operations:         │         │   Operations:         │
│   - Subscribe         │         │   - Subscribe         │
│   - JoinGame          │         │   - JoinGame          │
│   - MakeMove          │         │   - MakeMove          │
│   (sends messages)    │         │   (sends messages)    │
└───────────┬───────────┘         └───────────┬───────────┘
            │                                 │
            │      Cross-Chain Messages       │
            │                                 │
            └────────────┬────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    PLAY_CHAIN       │
              │  (Authoritative)    │
              │                     │
              │  State:             │
              │  - all_games        │
              │  - all_players      │
              │  - game_boards      │
              │                     │
              │  Receives:          │
              │  - RequestJoin      │
              │  - MakeMoveAction   │
              │                     │
              │  Emits:             │
              │  - GameEvent        │
              │  (to subscribers)   │
              └─────────────────────┘
```

### Message Flow Example

```
1. Player 1 clicks "Create Game"
   ↓
2. USER_CHAIN_1: Operation::CreateGame
   ↓
3. USER_CHAIN_1: Send Message::RequestCreateGame → PLAY_CHAIN
   ↓
4. PLAY_CHAIN: Receive message (bytecode auto-registers!)
   ↓
5. PLAY_CHAIN: Create game, assign game_id = 1
   ↓
6. PLAY_CHAIN: Send Message::CreateGameConfirmed → USER_CHAIN_1
   ↓
7. USER_CHAIN_1: Receive confirmation
   ↓
8. USER_CHAIN_1: Subscribe to PLAY_CHAIN events (NOW safe!)
   ↓
9. PLAY_CHAIN: Emit GameEvent::GameCreated
   ↓
10. USER_CHAIN_1: Receive event, update local state
```

---

## 🚀 How the Frontend Connects

### GraphQL Endpoint Structure

```
http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>
                            │                        │
                            │                        └─ Your deployed app ID
                            └─ The specific chain (USER_CHAIN_1, USER_CHAIN_2, or PLAY_CHAIN)
```

### Frontend Call Pattern

```typescript
// Set up endpoint
const CHAIN_ID = "abc123..."; // 64-char hex
const APP_ID = "def456..."; // 64-char hex
const endpoint = `http://localhost:8080/chains/${CHAIN_ID}/applications/${APP_ID}`;

// Call mutation
const createGame = async () => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation {
        createGame(playerX: "0xabc", playerO: "0xdef")
      }`,
    }),
  });

  const data = await response.json();
  return data.data.createGame;
};

// Call query
const getGame = async (gameId: number) => {
  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({
      query: `query { game(gameId: ${gameId}) { board status winner } }`,
    }),
  });

  const data = await response.json();
  return data.data.game;
};
```

### For Multiplayer (Future)

```typescript
// Player 1
const player1Endpoint = `http://localhost:8081/chains/${USER_CHAIN_1}/applications/${APP_ID_1}`;

// Player 2
const player2Endpoint = `http://localhost:8082/chains/${USER_CHAIN_2}/applications/${APP_ID_2}`;

// Query PLAY_CHAIN for authoritative state
const playChainEndpoint = `http://localhost:8081/chains/${PLAY_CHAIN}/applications/${APP_ID}`;
```

---

## ⚠️ Critical Learnings

### 1. Bytecode Propagation Pattern

**The Problem:**
You can't interact with a chain that doesn't have your application bytecode.

**The Solution:**
Send a cross-chain message first (which propagates bytecode), wait for confirmation, THEN subscribe.

**Code Pattern:**

```rust
// Step 1: Send message (propagates bytecode)
self.runtime.prepare_message(Message::RequestJoin {..}).send_to(play_chain_id);

// Step 2: Wait for confirmation message back
// (implement in execute_message handler)

// Step 3: Now subscribe (safe because bytecode exists)
self.runtime.subscribe_to_events(play_chain_id, app_id, stream_name);
```

### 2. Chain Synchronization

Always sync wallets after creating all chains:

```bash
linera --with-wallet 1 sync
linera --with-wallet 2 sync
```

This ensures all wallets know about all chains in the network.

### 3. Cross-Chain Delays

Cross-chain messages take time (typically 1-2 seconds). Frontend must wait:

```typescript
await sendMutation();
await new Promise((resolve) => setTimeout(resolve, 2000));
await fetchUpdatedState();
```

### 4. Version-Specific Differences

**Chain ID extraction varies:**

```bash
# v0.15.7+ (most reliable)
CHAIN_ID=$(linera wallet show | grep -E '^[a-f0-9]{64}$' | head -1)

# Older versions
CHAIN_ID=$(linera wallet show | grep "Public Key" -A 1 | tail -1 | awk '{print $1}')
```

---

## 📚 What to Do Next

### Immediate (Understanding Phase)

1. ✅ **Read QUICK_START_LINERA.md** - Get familiar with basics
2. ✅ **Read BACKEND_ANALYSIS.md** - Understand what's missing
3. 📖 **Study linot-card-game** - See working multiplayer implementation
   - `inspo/linot-card-game/backend/src/contract.rs`
   - `inspo/linot-card-game/docs/WORKING_FLOW_BACKEND.md`

### Planning Phase

1. 📝 **Design your multiplayer flow** - Sketch out messages and states
2. 📝 **List required changes** - Break down into small tasks
3. 📝 **Create test scenarios** - How will you verify each step?

### Implementation Phase

1. 🔧 **Add Message enum** - Start with simple messages
2. 🔧 **Add GameEvent enum** - Define what events to emit
3. 🔧 **Update State** - Add user_status, subscribed_chain, etc.
4. 🔧 **Implement handlers** - USER_CHAIN and PLAY_CHAIN logic
5. 🔧 **Add execute_message** - Handle cross-chain messages
6. 🔧 **Update run.bash** - Create multiple chains
7. 🔧 **Test locally** - 2 players, verify flow

### Frontend Phase

1. 🎨 **Add multi-endpoint support** - Switch between player chains
2. 🎨 **Update GraphQL calls** - Add new mutations
3. 🎨 **Add polling/subscriptions** - Real-time updates
4. 🎨 **Test end-to-end** - Full gameplay with 2 browsers

---

## 📖 Resources You Have Now

### Documentation (in docs/)

- **LINERA_INTEGRATION_COMPLETE_GUIDE.md** - Comprehensive deep dive (6,500 words)
- **BACKEND_ANALYSIS.md** - Current state + migration plan (4,000 words)
- **QUICK_START_LINERA.md** - Quick reference (this file)
- **FRONTEND_BACKEND_INTEGRATION.md** - API integration guide (existing)

### Reference Code (in inspo/)

- **linot-card-game/** - Best for multiplayer patterns
- **microcard-master/** - Complex game logic examples
- **microchess-main/** - Turn-based game patterns

### Official Docs

- https://linera.dev/developers - Main documentation
- https://linera.dev/developers/frontend.html - Frontend guide
- https://linera.dev/developers/backend/messages.html - Cross-chain messages

---

## ✅ Summary

**You now understand:**

- ✅ How your current Drawn backend works
- ✅ How Linera's microchain architecture works
- ✅ How GraphQL connects contracts to frontend
- ✅ How multiplayer should be implemented (USER_CHAIN + PLAY_CHAIN)
- ✅ The critical bytecode propagation pattern
- ✅ How local deployment works with multiple wallets
- ✅ What changes are needed for multiplayer

**Next step:** Choose whether to:

1. Keep building features on single-chain (simpler, works now)
2. Migrate to multiplayer architecture (better scalability, more complex)

Either way, you have comprehensive guides for both paths! 🚀
