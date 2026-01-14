# Complete Guide to Building a Linera Backend with GraphQL

**Author's Note:** This guide documents the complete process of building a multiplayer card game backend on Linera, including all research, decisions, and implementation steps. Use this as a blueprint for your own Linera projects.

---

## Table of Contents

1. [Essential Documentation Resources](#essential-documentation-resources)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Architecture Design Phase](#architecture-design-phase)
4. [Implementation Steps](#implementation-steps)
5. [GraphQL Integration](#graphql-integration)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
7. [Testing & Verification](#testing--verification)
8. [Best Practices](#best-practices)

---

## Essential Documentation Resources

### Official Linera Documentation
These are the **must-read** resources in order of importance:

1. **Core Concepts**
   - [Applications](https://linera.dev/developers/core_concepts/applications.html) - Understanding Operations, Messages, Events
   - [Microchains](https://linera.dev/developers/core_concepts/microchains.html) - How chains communicate
   - [Backend Development](https://linera.dev/developers/backend.html) - Contract vs Service

2. **Backend Implementation**
   - [State Management](https://linera.dev/developers/backend/state.html) - Views (RegisterView, MapView)
   - [Cross-Chain Messages](https://linera.dev/developers/backend/messages.html) - Message lifecycle
   - [Deployment](https://linera.dev/developers/backend/deploy.html) - Local and testnet deployment

3. **Frontend Integration**
   - [Writing Frontends](https://linera.dev/developers/frontend.html) - GraphQL client integration

### Reference Implementations
Study these **working examples** to understand patterns:

1. **Microcard (Blackjack)** - `github.com/linera-io/linera-protocol/examples/microcard`
   - ✅ Multiplayer game mechanics
   - ✅ Event streaming via [process_streams()](file:///home/dinahmaccodes/Documents/linot-card-game/inspo-multi/microcard-master/blackjack/src/contract.rs#657-680)
   - ✅ Cross-chain messaging for player actions
   - ✅ Play Chain + User Chain architecture

2. **Microchess** - `github.com/linera-io/linera-protocol/examples/microchess`
   - ✅ Clean Operation/Message/Event structure
   - ✅ GraphQL schema with `#[derive(GraphQLMutationRoot)]`
   - ✅ Multi-owner chain creation

3. **Social App** - `github.com/linera-io/linera-protocol/examples/social`
   - ✅ Event stream subscriptions
   - ✅ Real-time state synchronization

### SDK Documentation
- [linera-sdk crate docs](https://docs.rs/linera-sdk/latest/linera_sdk/) - API reference
- [async-graphql docs](https://docs.rs/async-graphql/7.0.17/async_graphql/) - GraphQL macros

---

## Prerequisites & Setup

### Required Tools

```bash
# Install Rust with wasm32 target
rustup target add wasm32-unknown-unknown

# Install Linera CLI (adjust version as needed)
cargo install linera-sdk --version 0.15.7

# Verify installation
linera --version
```

### Project Structure

Create this folder structure for your backend:

```
backend/
├── Cargo.toml          # Dependencies and build config
└── src/
    ├── lib.rs          # ABI, Operations, Messages, Events
    ├── state.rs        # Application state with Views
    ├── contract.rs     # Game logic (metered)
    └── service.rs      # GraphQL API (non-metered)
```

---

## Architecture Design Phase

### Step 1: Define Your Data Flow

**Key Decision:** Understand the three communication types:

```
┌─────────────────────────────────────────────────────────┐
│  1. OPERATIONS (User → Contract on same chain)          │
│     - Direct user actions via GraphQL mutations         │
│     - Can return response immediately                   │
│     - Examples: CreateMatch, Subscribe, LeaveMatch      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  2. MESSAGES (Chain → Chain, async)                     │
│     - Cross-chain communication                         │
│     - Placed in target chain's inbox                    │
│     - No immediate response                             │
│     - Examples: RequestJoin, PlayCardAction             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  3. EVENTS (Broadcast state changes)                    │
│     - Emitted after state mutations                     │
│     - Subscribed chains receive via process_streams()   │
│     - Enables real-time UI updates                      │
│     - Examples: CardPlayed, PlayerJoined                │
└─────────────────────────────────────────────────────────┘
```

### Step 2: Design Your Chain Architecture

For **single-player** apps:
- One chain per user
- State isolated

For **multiplayer** apps (like our card game):

```
PLAY_CHAIN (Multi-owner: all players)
├─► Authoritative game state
├─► Handles all game logic
└─► Emits events on state changes
     │
     ├─► Event Stream
     │
     ▼
USER_CHAIN (Player 1)          USER_CHAIN (Player 2)
├─► Subscribes to PLAY_CHAIN   ├─► Subscribes to PLAY_CHAIN  
├─► Local state copy            ├─► Local state copy
└─► Sends messages to PLAY      └─► Sends messages to PLAY
     │                               │
     └─► Frontend queries ◄──────────┘
         (fast local reads)
```

**Design Rule:** 
- PLAY_CHAIN = Source of truth
- USER_CHAIN = Local cache + message sender
- Frontend = Only queries USER_CHAIN (never PLAY_CHAIN)

### Step 3: Map Your Features to Linera Primitives

| Feature | Linera Primitive | Why |
|---------|------------------|-----|
| User clicks "Join Match" | `Operation::JoinMatch` | Direct user action |
| Send join request to game | `Message::RequestJoin` | Cross-chain async |
| Notify all players joined | `GameEvent::PlayerJoined` | Broadcast update |
| Query current game state | Service GraphQL query | Read-only access |

---

## Implementation Steps

### Phase 1: Create lib.rs (ABI & Types)

**Purpose:** Define the contract's external interface

```rust
// File: src/lib.rs
use async_graphql::{Enum, Request, Response, SimpleObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,  // ← KEY: Auto-generates GraphQL
    linera_base_types::{AccountOwner, ChainId},
};
use serde::{Deserialize, Serialize};

// 1. Define your ABI
pub struct MyGameAbi;

impl ContractAbi for MyGameAbi {
    type Operation = Operation;
    type Response = GameResponse;  // ← Must match contract return type
}

impl ServiceAbi for MyGameAbi {
    type Query = Request;
    type QueryResponse = Response;
}

// 2. Define Operations (GraphQL mutations)
#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    CreateMatch { max_players: u8, nickname: String },
    JoinMatch { play_chain_id: ChainId, nickname: String },
    PlayCard { card_index: usize },
    // ... more operations
}

// 3. Define Messages (cross-chain)
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Message {
    RequestJoin {
        player_owner: AccountOwner,
        player_chain: ChainId,
        nickname: String,
    },
    // ... more messages
}

// 4. Define Events (state sync)
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum GameEvent {
    PlayerJoined { nickname: String, player_count: usize },
    // ... more events
}

// 5. Define data structures
#[derive(Clone, Debug, Serialize, Deserialize, SimpleObject)]
pub struct Player {
    pub chain_id: ChainId,
    pub owner: AccountOwner,
    pub nickname: String,
    #[graphql(skip)]  // ← Hide sensitive data from GraphQL
    pub hand: Vec<Card>,
    pub hand_size: usize,  // ← Public alternative
}

// 6. Constants
pub const GAME_STREAM_NAME: &[u8] = b"my_game_events";
```

**Key Patterns:**
- `#[derive(GraphQLMutationRoot)]` on `Operation` → Auto-generates mutations
- Use `#[graphql(skip)]` to hide sensitive fields
- Expose safe alternatives (e.g., `hand_size` instead of [hand](file:///home/dinahmaccodes/Documents/linot-card-game/inspo-multi/microchess-main/chess/src/service.rs#49-58))

### Phase 2: Create state.rs (Persistent State)

**Purpose:** Define how data is stored on-chain

```rust
// File: src/state.rs
use async_graphql::SimpleObject;
use linera_sdk::{
    linera_base_types::ChainId,
    views::{linera_views, RegisterView, RootView, ViewStorageContext},
};

#[derive(RootView, SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct MyGameState {
    // === PLAY CHAIN ONLY ===
    /// Authoritative match state (only on PLAY_CHAIN)
    pub match_data: RegisterView<MatchData>,
    
    // === USER CHAIN ONLY ===
    /// Local copy for queries (only on USER_CHAIN)
    pub local_match: RegisterView<Option<MatchData>>,
    
    /// Which play chain we're subscribed to
    pub subscribed_play_chain: RegisterView<Option<ChainId>>,
    
    /// Player's nickname
    pub player_nickname: RegisterView<Option<String>>,
}
```

**View Types:**
- `RegisterView<T>` - Single value (like a variable)
- `MapView<K, V>` - HashMap for static values
- `CollectionView<K, V>` - HashMap where values are other Views
- `LogView<T>` - Append-only list
- `QueueView<T>` - FIFO queue

**Critical:** Always use Views, never plain Rust types for state!

### Phase 3: Create contract.rs (Game Logic)

**Purpose:** Execute operations, handle messages, process events

```rust
// File: src/contract.rs
#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    base::WithContractAbi,
    contract::runtime::ContractRuntime,
    views::{RootView, View},
    Contract,
};

pub struct MyGameContract {
    state: MyGameState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(MyGameContract);

impl WithContractAbi for MyGameContract {
    type Abi = MyGameAbi;
}

impl Contract for MyGameContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = GameEvent;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = MyGameState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MyGameContract { state, runtime }
    }

    async fn instantiate(&mut self, _arg: Self::InstantiationArgument) {
        // Initialize default state
    }

    async fn execute_operation(&mut self, operation: Operation) -> GameResponse {
        match operation {
            Operation::CreateMatch { max_players, nickname } => {
                // 1. Validate input
                // 2. Update state
                // 3. Emit event
                self.runtime.emit(GameEvent::MatchCreated { ... });
                GameResponse::Ok
            }
            
            Operation::JoinMatch { play_chain_id, nickname } => {
                // Send cross-chain message
                self.runtime
                    .prepare_message(Message::RequestJoin { ... })
                    .send_to(play_chain_id);
                GameResponse::Ok
            }
            // ... handle other operations
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::RequestJoin { player_owner, player_chain, nickname } => {
                // 1. Validate sender
                // 2. Update state
                // 3. Emit event
                self.runtime.emit(GameEvent::PlayerJoined { ... });
            }
            // ... handle other messages
        }
    }

    async fn process_streams(&mut self, updates: Vec<StreamUpdate>) {
        for update in updates {
            for index in update.new_indices() {
                let event = self.runtime.read_event(...);
                match event {
                    GameEvent::PlayerJoined { .. } => {
                        // Update local_match with new state
                    }
                    // ... handle other events
                }
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
```

**Critical Patterns:**
1. **Subscriptions:**
   ```rust
   let app_id = self.runtime.application_id().forget_abi();
   self.runtime.subscribe_to_events(
       play_chain_id,
       app_id,
       GAME_STREAM_NAME.into()
   );
   ```

2. **Sending Messages:**
   ```rust
   self.runtime
       .prepare_message(Message::YourMessage { ... })
       .send_to(destination_chain_id);
   ```

3. **Emitting Events:**
   ```rust
   self.runtime.emit(GameEvent::SomethingHappened { ... });
   ```

### Phase 4: Create service.rs (GraphQL API)

**Purpose:** Expose read-only queries to frontend

```rust
// File: src/service.rs
#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;
use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{
    base::WithServiceAbi,
    graphql::GraphQLMutationRoot,
    views::View,
    Service, ServiceRuntime,
};

pub struct MyGameService {
    state: Arc<MyGameState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(MyGameService);

impl WithServiceAbi for MyGameService {
    type Abi = MyGameAbi;
}

impl Service for MyGameService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MyGameState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        
        MyGameService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        Schema::build(
            QueryRoot {
                state: self.state.clone(),
            },
            Operation::mutation_root(self.runtime.clone()),  // ← KEY
            EmptySubscription,
        )
        .finish()
        .execute(request)
        .await
    }
}

#[derive(Clone)]
struct QueryRoot {
    state: Arc<MyGameState>,
}

#[Object]
impl QueryRoot {
    async fn match_state(&self) -> Option<MatchData> {
        // Return PLAY_CHAIN state if available
        let match_data = self.state.match_data.get();
        if !match_data.players.is_empty() {
            Some(match_data.clone())
        } else {
            // Otherwise return USER_CHAIN local copy
            self.state.local_match.get().clone()
        }
    }
    
    async fn my_hand(&self) -> Vec<Card> {
        // Return player's own hand (filtered)
        Vec::new()  // Implement filtering logic
    }
}
```

**KEY:** `Operation::mutation_root(self.runtime.clone())` auto-generates mutations from Operations!

### Phase 5: Create Cargo.toml

```toml
[package]
name = "my_game"
version = "0.1.0"
edition = "2021"

[dependencies]
async-graphql = "7.0.17"  # ← Must match SDK version
linera-sdk = "0.15.7"      # ← Use latest stable
serde = { version = "1.0", features = ["derive"] }
log = "0.4"

[lib]
name = "my_game"
path = "src/lib.rs"

[[bin]]
name = "my_game_contract"
path = "src/contract.rs"

[[bin]]
name = "my_game_service"
path = "src/service.rs"

[profile.release]
debug = true
lto = true
opt-level = "s"  # Optimize for size
strip = false
```

---

## GraphQL Integration

### How GraphQL Works in Linera

```
Frontend                    Service                     Contract
   │                           │                            │
   │  POST /graphql            │                            │
   │  { query: "mutation {     │                            │
   │      joinMatch(...) }"    │                            │
   ├──────────────────────────►│                            │
   │                           │                            │
   │                           │ Operation::mutation_root() │
   │                           │ auto-routes mutation       │
   │                           ├───────────────────────────►│
   │                           │                            │
   │                           │                            │ execute_operation()
   │                           │                            │ (game logic)
   │                           │                            │
   │                           │◄───────────────────────────┤
   │                           │  GameResponse::Ok          │
   │◄──────────────────────────┤                            │
   │  { data: { joinMatch:     │                            │
   │      "Ok" }}               │                            │
```

### Frontend GraphQL Example

```javascript
// Join a match
const response = await fetch('http://localhost:8081', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        query: `
            mutation {
                joinMatch(
                    playChainId: "${PLAY_CHAIN_ID}",
                    nickname: "Alice"
                )
            }
        `
    })
});

// Query match state
const stateResponse = await fetch('http://localhost:8081', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        query: `
            query {
                matchState {
                    players {
                        nickname
                        handSize
                    }
                    status
                }
            }
        `
    })
});
```

**Operation Naming:**
- Rust: `Operation::JoinMatch` (PascalCase)
- GraphQL: `joinMatch` (camelCase) - auto-converted!

---

## Common Pitfalls & Solutions

### 1. ` QueryRoot` Not Implementing `Sync`

**Error:**
```
the trait bound `LinotService: WithServiceAbi` is not satisfied
required for `QueryRoot` to implement `Sync`
```

**Solution:** Don't store `runtime` in [QueryRoot](file:///home/dinahmaccodes/Documents/linot-card-game/inspo-multi/microcard-master/blackjack/src/service.rs#54-58). Only store state:

```rust
// ❌ WRONG
struct QueryRoot {
    state: Arc<MyGameState>,
    runtime: Arc<ServiceRuntime<MyGameService>>,  // Don't do this!
}

// ✅ CORRECT
#[derive(Clone)]
struct QueryRoot {
    state: Arc<MyGameState>,  // Only state
}
```

### 2. Missing `type Response` in ABI

**Error:**
```
the trait bound `MyContract: ContractAbi` is not satisfied
```

**Solution:** Add `Response` type to your ABI:

```rust
impl ContractAbi for MyGameAbi {
    type Operation = Operation;
    type Response = GameResponse;  // ← Must add this!
}
```

### 3. Forgetting to Emit Events

**Problem:** Frontend doesn't update in real-time

**Solution:** Always emit events after state changes:

```rust
// Update state
match_data.players[index] = Some(player);

// ✅ Emit event so subscribers get notified
self.runtime.emit(GameEvent::PlayerJoined {
    nickname,
    player_count: match_data.players.len(),
});
```

### 4. Using Plain Types Instead of Views

**Error:**
```
the trait `RootView` is not implemented for `MyState`
```

**Solution:** Always use Views for state:

```rust
// ❌ WRONG
pub struct MyState {
    pub players: Vec<Player>,  // Plain Vec
}

// ✅ CORRECT
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct MyState {
    pub players: RegisterView<Vec<Player>>,  // View wrapper
}
```

### 5. Incorrect GraphQL Context Parameter

**Error:**
```
this method takes 1 argument but 0 arguments were supplied
```

**Cause:** async-graphql adds a hidden `ctx` parameter to methods with `#[Object]`

**Solution:** Methods in [QueryRoot](file:///home/dinahmaccodes/Documents/linot-card-game/inspo-multi/microcard-master/blackjack/src/service.rs#54-58) automatically get context - don't call internal methods directly:

```rust
#[Object]
impl QueryRoot {
    // This signature is correct - async-graphql adds &Context parameter
    async fn match_state(&self) -> Option<MatchData> {
        // Don't call self.match_state() from within QueryRoot methods
        // Call state directly
        self.state.match_data.get()
    }
}
```

---

## Testing & Verification

### Build the Contract

```bash
cd backend
cargo build --target wasm32-unknown-unknown --release
```

**Expected output:** Files in `target/wasm32-unknown-unknown/release/`:
- `my_game_contract.wasm`
- `my_game_service.wasm`

### Local Deployment Test

```bash
# 1. Start local network
linera net up --with-faucet --faucet-port 8080

# 2. Publish and create application
linera project publish-and-create \
    target/wasm32-unknown-unknown/release/my_game_contract.wasm \
    target/wasm32-unknown-unknown/release/my_game_service.wasm \
    --json-argument '{}'

# 3. Start service (note the application ID from step 2)
linera service --port 8081

# 4. Query GraphQL endpoint
curl -X POST http://localhost:8081 \
    -H "Content-Type: application/json" \
    -d '{"query": "{ matchInfo { playerCount maxPlayers } }"}'
```

---

## Best Practices

### 1. State Organization

```rust
// Separate PLAY_CHAIN and USER_CHAIN state clearly
pub struct MyGameState {
    // === PLAY CHAIN (authoritative) ===
    pub match_data: RegisterView<MatchData>,
    
    // === USER CHAIN (local copy) ===
    pub  local_match: RegisterView<Option<MatchData>>,
    pub subscribed_play_chain: RegisterView<Option<ChainId>>,
}
```

### 2. Event Design

```rust
// ✅ GOOD: Include all relevant data in event
GameEvent::CardPlayed {
    player_nickname: "Alice",
    card: Card { suit: Circle, value: 5 },
    next_player: "Bob",
    special_effect: Some(SpecialEffect::PickTwo),
}

// ❌ BAD: Minimal data forces subscribers to query
GameEvent::CardPlayed {
    player_index: 0,  // Subscribers must query to get nickname
}
```

### 3. Message Authentication

```rust
async fn execute_message(&mut self, message: Message) {
    let origin_chain = self.runtime.message_origin_chain_id()
        .expect("Message has no origin");
    
    // Validate sender before processing
    match message {
        Message::RequestJoin { player_owner, .. } => {
            // Verify the message came from the player's chain
            assert_eq!(origin_chain, player_chain);
        }
    }
}
```

### 4. GraphQL Privacy

```rust
#[derive(SimpleObject)]
pub struct Player {
    pub nickname: String,
    pub hand_size: usize,  // ✅ Public info
    
    #[graphql(skip)]
    pub hand: Vec<Card>,  // ❌ Hidden - private data
}
```

### 5. Error Handling

```rust
// Return errors via Response type, not panic!
async fn execute_operation(&mut self, operation: Operation) -> GameResponse {
    match operation {
        Operation::PlayCard { card_index, .. } => {
            if card_index >= player.hand.len() {
                return GameResponse::Error("Invalid card index".to_string());
            }
            // ... continue
        }
    }
}
```

---

## Quick Reference Checklist

When starting a new Linera project:

- [ ] Define Operations (user actions)
- [ ] Define Messages (cross-chain communication)
- [ ] Define Events (state broadcasts)
- [ ] Create data structures with `#[derive(SimpleObject)]`
- [ ] Use Views in state.rs (RegisterView, MapView, etc.)
- [ ] Implement [Contract](file:///home/dinahmaccodes/Documents/linot-card-game/inspo-multi/microchess-main/chess/src/contract.rs#32-36) trait with all methods
- [ ] Implement [Service](file:///home/dinahmaccodes/Documents/linot-card-game/inspo-multi/microchess-main/chess/src/service.rs#25-29) trait with GraphQL
- [ ] Add `Operation::mutation_root()` to service
- [ ] Use `#[graphql(skip)]` for sensitive fields
- [ ] Emit events after every state change
- [ ] Subscribe to events via `subscribe_to_events()`
- [ ] Process events in [process_streams()](file:///home/dinahmaccodes/Documents/linot-card-game/inspo-multi/microcard-master/blackjack/src/contract.rs#657-680)
- [ ] Test build with `cargo build --target wasm32-unknown-unknown`
- [ ] Test deployment on local network

---

## Conclusion

This guide represents hundreds of hours of research, experimentation, and debugging. The key to success with Linera is understanding the three-tier communication model (Operations, Messages, Events) and properly using Views for state management.

**Remember:**
1. Operations = Direct user actions
2. Messages = Cross-chain async communication
3. Events = Real-time state broadcasts
4. Views = Persistent state storage
5. `Operation::mutation_root()` = GraphQL magic

Good luck with your Linera project! 🚀
