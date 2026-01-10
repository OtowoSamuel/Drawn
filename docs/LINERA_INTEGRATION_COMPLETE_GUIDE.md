# 🎯 Complete Linera Integration Guide for Drawn

> **Based on:** Linera v0.15.5-0.15.7, microcard, microchess, and linot patterns  
> **Project:** Drawn - Tic-Tac-Toe NFT Sticker Game  
> **Last Updated:** January 10, 2026

---

## 📚 Table of Contents

1. [Understanding Linera Architecture](#understanding-linera-architecture)
2. [How Your Current Setup Works](#how-your-current-setup-works)
3. [The Contract → GraphQL → Frontend Flow](#the-contract--graphql--frontend-flow)
4. [Multiplayer Chain Architecture](#multiplayer-chain-architecture)
5. [Local Deployment Workflow](#local-deployment-workflow)
6. [GraphQL Mutations & Queries](#graphql-mutations--queries)
7. [Frontend Integration Patterns](#frontend-integration-patterns)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## 1. Understanding Linera Architecture

### What is Linera?

Linera is a **microchain** blockchain where:

- Each **user gets their own chain** (microchain)
- Chains communicate via **cross-chain messages**
- Applications are **WebAssembly (WASM)** contracts written in Rust
- **GraphQL** is the primary interface for reading/writing data

### Core Components

```
┌────────────────────────────────────────────────────────────┐
│                    Linera Network                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ USER_CHAIN_1 │    │ USER_CHAIN_2 │    │  PLAY_CHAIN  │ │
│  │ (Player 1)   │───►│ (Player 2)   │◄───│ (Game State) │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                     │                    │        │
│         └────────── Messages ──────────────────────┘        │
└────────────────────────────────────────────────────────────┘
                          │
                          │ GraphQL API (Port 8080)
                          ▼
              ┌────────────────────────┐
              │  Frontend (React/Vite) │
              │     Port 5173/8080     │
              └────────────────────────┘
```

### Key Concepts

#### **Microchains**

- **USER_CHAIN**: Each player has their own chain for personal state
- **PLAY_CHAIN**: Shared chain that holds authoritative game state
- **Messages**: How chains communicate (async cross-chain messaging)

#### **Application Bytecode**

- Deployed once on a chain
- **Automatically propagates** to other chains on first cross-chain message
- **Critical:** You can't interact with a chain until it has the bytecode!

#### **State vs Service**

- **Contract (contract.rs)**: Write operations (`execute_operation`, `execute_message`)
- **Service (service.rs)**: Read operations (GraphQL queries)
- **State (state.rs)**: Data persistence layer

---

## 2. How Your Current Setup Works

### Your Drawn Contract Structure

```
contracts/src/
├── lib.rs         # Types: Operation, OperationResponse, Game, PlayerStats
├── contract.rs    # Contract logic: CreateGame, MakeMove
├── service.rs     # GraphQL service: queries
└── state.rs       # State: games, player_stats, counters
```

### What You Have (Tic-Tac-Toe)

**Operations (Mutations):**

```rust
pub enum Operation {
    CreateGame { player_x: String, player_o: Option<String> },
    MakeMove { game_id: u64, player: String, position: u8 },
}
```

**State:**

```rust
pub struct TicTacToeState {
    next_game_id: RegisterView<u64>,      // Auto-increment counter
    games: MapView<u64, Game>,            // game_id -> Game
    player_stats: MapView<String, PlayerStats>, // address -> stats
    total_games: RegisterView<u64>,       // Total games count
}
```

**Service (Queries):**

```rust
- next_game_id() -> u64
- total_games() -> u64
- game(game_id: u64) -> Option<Game>
- player_stats(address: String) -> Option<PlayerStats>
```

### Current Issues for Multiplayer

🚨 **Your contract doesn't have:**

1. Cross-chain messaging (no `Message` enum)
2. Chain type distinction (USER_CHAIN vs PLAY_CHAIN)
3. Event streams for real-time updates
4. Subscription mechanism

---

## 3. The Contract → GraphQL → Frontend Flow

### The Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Contract Deployment                                     │
└─────────────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │ run.bash script:                │
         │ 1. linera net up --with-faucet │
         │ 2. linera publish-bytecode     │
         │ 3. linera create-application   │
         │ 4. linera service --port 8080  │
         └────────────────┬────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: GraphQL Service Running                                 │
│ http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>  │
└─────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │   GraphQL Schema Generated    │
          │   from Rust types:            │
          │   - Operations → Mutations    │
          │   - QueryRoot → Queries       │
          └───────────────┬───────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Frontend Makes Request                                  │
│                                                                  │
│  fetch('http://localhost:8080/chains/ABC.../applications/XYZ', │
│    body: JSON.stringify({                                      │
│      query: `mutation { createGame(...) }`                     │
│    })                                                           │
│  )                                                              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: GraphQL → Contract                                      │
│                                                                  │
│  service.rs: handle_query() receives request                   │
│      │                                                          │
│      ├─ Mutation? → calls Contract::execute_operation()        │
│      └─ Query? → reads from State via QueryRoot                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Contract Processes                                      │
│                                                                  │
│  contract.rs: execute_operation(Operation::CreateGame)         │
│      │                                                          │
│      ├─ Validates input                                        │
│      ├─ Updates state.games.insert(...)                        │
│      ├─ Updates state.player_stats                             │
│      └─ Returns OperationResponse::GameCreated(game_id)        │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Response Back to Frontend                               │
│                                                                  │
│  {                                                              │
│    "data": {                                                    │
│      "createGame": { "gameId": 1 }                             │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Code Example: Complete Flow

**1. Contract (contract.rs)**

```rust
async fn execute_operation(&mut self, operation: Operation) -> OperationResponse {
    match operation {
        Operation::CreateGame { player_x, player_o } => {
            let game_id = *self.state.next_game_id.get();

            let game = Game {
                game_id,
                player_x: player_x.clone(),
                player_o: player_o.unwrap_or("AI".to_string()),
                board: vec![None; 9],
                current_turn: PlayerSymbol::X,
                status: GameStatus::Active,
                created_at: self.runtime.system_time().micros(),
                winner: None,
            };

            // WRITE TO STATE
            self.state.games.insert(&game_id, game).expect("Failed");
            self.state.next_game_id.set(game_id + 1);

            OperationResponse::GameCreated(game_id)
        }
    }
}
```

**2. Service (service.rs)**

```rust
async fn handle_query(&self, query: Request) -> Response {
    let schema = Schema::build(
        QueryRoot { state: self.state.clone() },
        Operation::mutation_root(self.runtime.clone()), // ← Auto-generates mutations!
        EmptySubscription,
    ).finish();

    schema.execute(query).await
}

#[Object]
impl QueryRoot {
    async fn game(&self, game_id: u64) -> Option<Game> {
        // READ FROM STATE
        self.state.get_game(game_id).await
    }
}
```

**3. Frontend (React)**

```typescript
// Mutation (Write)
const createGame = async (playerX: string) => {
  const response = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation CreateGame($playerX: String!) {
        createGame(playerX: $playerX) {
          ... on OperationResponse {
            __typename
            ... on GameCreated { gameId }
          }
        }
      }`,
      variables: { playerX },
    }),
  });

  const data = await response.json();
  return data.data.createGame.gameId;
};

// Query (Read)
const fetchGame = async (gameId: number) => {
  const response = await fetch(graphqlEndpoint, {
    method: "POST",
    body: JSON.stringify({
      query: `query GetGame($gameId: Int!) {
        game(gameId: $gameId) {
          gameId
          playerX
          playerO
          board
          status
        }
      }`,
      variables: { gameId },
    }),
  });

  const data = await response.json();
  return data.data.game;
};
```

---

## 4. Multiplayer Chain Architecture

### The Problem You Need to Solve

**Current:** Your contract works on a **single chain** only.

**Needed:** Multiplayer where each player has their own chain.

### Reference Pattern (From linot-card-game)

```
┌──────────────────┐         ┌──────────────────┐
│  USER_CHAIN_1    │         │  USER_CHAIN_2    │
│  (Player 1)      │         │  (Player 2)      │
│                  │         │                  │
│  Operations:     │         │  Operations:     │
│  - Subscribe     │         │  - Subscribe     │
│  - JoinMatch     │         │  - JoinMatch     │
│  - PlayCard      │         │  - MakeMove      │
│                  │         │                  │
│  State:          │         │  State:          │
│  - my_hand       │         │  - my_hand       │
│  - user_status   │         │  - user_status   │
└────────┬─────────┘         └─────────┬────────┘
         │                              │
         │      Cross-Chain Messages    │
         └──────────────┬───────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   PLAY_CHAIN     │
              │  (Authoritative) │
              │                  │
              │  Messages:       │
              │  - RequestJoin   │
              │  - PlayCardAction│
              │  - StartMatch    │
              │                  │
              │  State:          │
              │  - match_data    │
              │  - all_players   │
              │  - game_board    │
              │                  │
              │  Events:         │
              │  - MatchUpdated  │
              │  - TurnChanged   │
              └──────────────────┘
```

### Implementation Steps

#### **1. Add Message Enum**

```rust
// lib.rs
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    /// USER_CHAIN → PLAY_CHAIN: Request to join a game
    RequestJoinGame {
        player_owner: AccountOwner,
        nickname: String,
    },

    /// PLAY_CHAIN → USER_CHAIN: Confirm join successful
    JoinGameConfirmed {
        game_id: u64,
        success: bool,
    },

    /// USER_CHAIN → PLAY_CHAIN: Make a move
    MakeMoveAction {
        game_id: u64,
        player_owner: AccountOwner,
        position: u8,
    },

    /// PLAY_CHAIN → USER_CHAIN: Game state update (via events)
    GameStateUpdate {
        game_id: u64,
        board: Vec<Option<PlayerSymbol>>,
        current_turn: PlayerSymbol,
        status: GameStatus,
    },
}
```

#### **2. Implement execute_message**

```rust
// contract.rs
impl Contract for TicTacToeContract {
    type Message = Message; // ← Add this

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::RequestJoinGame { player_owner, nickname } => {
                // PLAY_CHAIN receives this
                self.handle_join_request(player_owner, nickname).await;
            }

            Message::JoinGameConfirmed { game_id, success } => {
                // USER_CHAIN receives this
                self.handle_join_confirmed(game_id, success).await;
            }

            Message::MakeMoveAction { game_id, player_owner, position } => {
                // PLAY_CHAIN receives this
                self.handle_move_action(game_id, player_owner, position).await;
            }

            Message::GameStateUpdate { game_id, board, current_turn, status } => {
                // USER_CHAIN receives this (via events)
                self.update_local_game_state(game_id, board, current_turn, status).await;
            }
        }
    }
}
```

#### **3. Add Event Streams**

```rust
// lib.rs
pub const GAME_STREAM_NAME: &[u8] = b"game-events";

#[derive(Debug, Serialize, Deserialize)]
pub enum GameEvent {
    GameCreated { game_id: u64 },
    PlayerJoined { game_id: u64, player: String },
    MoveMade { game_id: u64, position: u8, player: PlayerSymbol },
    GameEnded { game_id: u64, result: GameResult },
}
```

```rust
// contract.rs - emit events on PLAY_CHAIN
self.runtime.emit(GameEvent::PlayerJoined { game_id, player: nickname });
```

#### **4. Subscribe Pattern (Critical!)**

```rust
// From linot pattern - DO THIS ORDER!
pub async fn handle_join_game(&mut self, play_chain_id: ChainId, nickname: String) {
    // 1. Send message FIRST (this propagates bytecode!)
    let message = Message::RequestJoinGame {
        player_owner: self.runtime.authenticated_signer().unwrap(),
        nickname: nickname.clone(),
    };
    self.runtime.prepare_message(message).send_to(play_chain_id);

    // 2. DON'T subscribe yet - wait for confirmation!
    self.state.user_status.set(UserStatus::WaitingToJoin);
}

pub async fn handle_join_confirmed(&mut self, game_id: u64, success: bool) {
    if !success {
        self.state.user_status.set(UserStatus::Idle);
        return;
    }

    // 3. NOW subscribe - PLAY_CHAIN has bytecode now!
    let play_chain_id = self.state.play_chain_id.get().unwrap();
    let app_id = self.runtime.application_id().forget_abi();

    self.runtime.subscribe_to_events(
        play_chain_id,
        app_id,
        GAME_STREAM_NAME.into()
    );

    self.state.user_status.set(UserStatus::InGame);
}
```

**⚠️ CRITICAL ORDERING:**

1. Send message to PLAY_CHAIN (bytecode propagates)
2. Wait for confirmation message back
3. THEN subscribe to events

**Why?** You can't subscribe to a chain that doesn't have your application bytecode yet!

---

## 5. Local Deployment Workflow

### Understanding run.bash

Your `run.bash` script does these steps:

```bash
#!/usr/bin/env bash

# 1. Start Linera network with faucet
linera net up --with-faucet

# 2. Initialize wallet
linera wallet init --faucet="http://localhost:8080"

# 3. Request a chain (this becomes your default chain)
linera wallet request-chain --faucet="http://localhost:8080"

# 4. Build WASM contracts
cd contracts
cargo build --release --target wasm32-unknown-unknown

# 5. Publish bytecode
BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/drawn_contract.wasm \
  target/wasm32-unknown-unknown/release/drawn_service.wasm)

# 6. Create application instance
APP_ID=$(linera create-application $BYTECODE_ID)

# 7. Get chain ID
CHAIN_ID=$(linera wallet show | grep -E '^[a-f0-9]{64}$' | head -1)

# 8. Start GraphQL service
linera service --port 8080

# GraphQL endpoint is now:
# http://localhost:8080/chains/$CHAIN_ID/applications/$APP_ID
```

### For Multiplayer, You Need:

```bash
# Create multiple wallets
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_WALLET_2="$LINERA_TMP_DIR/wallet_2.json"

# Initialize Player 1
linera --with-wallet 1 wallet init --faucet="$FAUCET_URL"
USER_CHAIN_1=$(linera --with-wallet 1 wallet request-chain --faucet="$FAUCET_URL" | grep -E '^[a-f0-9]{64}$')

# Initialize Player 2
linera --with-wallet 2 wallet init --faucet="$FAUCET_URL"
USER_CHAIN_2=$(linera --with-wallet 2 wallet request-chain --faucet="$FAUCET_URL" | grep -E '^[a-f0-9]{64}$')

# Create PLAY_CHAIN (shared)
PLAY_CHAIN=$(linera --with-wallet 1 wallet request-chain --faucet="$FAUCET_URL" | grep -E '^[a-f0-9]{64}$')

# Sync wallets (important!)
linera --with-wallet 1 sync
linera --with-wallet 2 sync

# Publish bytecode (once, from wallet 1)
BYTECODE_ID=$(linera --with-wallet 1 publish-bytecode ...)

# Create app on USER_CHAIN_1
APP_ID_1=$(linera --with-wallet 1 create-application $BYTECODE_ID)

# Create app on USER_CHAIN_2
APP_ID_2=$(linera --with-wallet 2 create-application $BYTECODE_ID)

# Create app on PLAY_CHAIN
linera --with-wallet 1 --chain $PLAY_CHAIN create-application $BYTECODE_ID

# Start services for each player
linera --with-wallet 1 service --port 8081 &
linera --with-wallet 2 service --port 8082 &

# Player 1 GraphQL: http://localhost:8081/chains/$USER_CHAIN_1/applications/$APP_ID_1
# Player 2 GraphQL: http://localhost:8082/chains/$USER_CHAIN_2/applications/$APP_ID_2
```

### Key Differences by Version

**v0.15.5 - v0.15.7 Changes:**

1. **Faucet URL format:**

   - v0.15.5: `--faucet http://localhost:8080`
   - v0.15.6+: `--faucet="http://localhost:8080"` (quotes required)

2. **Chain ID extraction:**

   ```bash
   # v0.15.5-0.15.6
   CHAIN_ID=$(linera wallet show | grep "Public Key" -A 1 | tail -1 | awk '{print $1}')

   # v0.15.7 (more reliable)
   CHAIN_ID=$(linera wallet show | grep -E '^[a-f0-9]{64}$' | head -1)
   ```

3. **Service command:**

   ```bash
   # v0.15.5
   linera service --port 8080

   # v0.15.6+
   linera service --port 8080 --listener-skip-process-inbox
   ```

---

## 6. GraphQL Mutations & Queries

### How Operations Become Mutations

Your Rust `Operation` enum automatically becomes GraphQL mutations via `#[derive(GraphQLMutationRoot)]`:

**Rust:**

```rust
#[derive(GraphQLMutationRoot)]
pub enum Operation {
    CreateGame { player_x: String, player_o: Option<String> },
    MakeMove { game_id: u64, player: String, position: u8 },
}
```

**GraphQL (auto-generated):**

```graphql
type Mutation {
  createGame(playerX: String!, playerO: String): OperationResponse!
  makeMove(gameId: Int!, player: String!, position: Int!): OperationResponse!
}
```

### Querying from Frontend

**TypeScript:**

```typescript
const GRAPHQL_ENDPOINT = `http://localhost:8080/chains/${CHAIN_ID}/applications/${APP_ID}`;

// Create game mutation
const createGameMutation = async (playerX: string, playerO?: string) => {
  const query = `
    mutation CreateGame($playerX: String!, $playerO: String) {
      createGame(playerX: $playerX, playerO: $playerO)
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { playerX, playerO },
    }),
  });

  const data = await response.json();
  if (data.errors) {
    console.error("GraphQL error:", data.errors);
    throw new Error(data.errors[0].message);
  }

  return data.data.createGame;
};

// Query game state
const queryGame = async (gameId: number) => {
  const query = `
    query GetGame($gameId: Int!) {
      game(gameId: $gameId) {
        gameId
        playerX
        playerO
        board
        currentTurn
        status
        winner
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { gameId },
    }),
  });

  const data = await response.json();
  return data.data.game;
};
```

### Using GraphiQL for Testing

1. **Open GraphiQL:** `http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>`

2. **Test mutation:**

```graphql
mutation {
  createGame(playerX: "0xabc123", playerO: "0xdef456")
}
```

3. **Test query:**

```graphql
query {
  game(gameId: 1) {
    gameId
    playerX
    board
    status
  }
}
```

4. **Explore schema:** Click "Docs" in GraphiQL to see all available operations

---

## 7. Frontend Integration Patterns

### Pattern 1: Single Player (Current Drawn Setup)

**Use case:** Single-chain application, no cross-chain messaging

```typescript
// Simple direct GraphQL calls
const game = await createGame(myAddress, "AI");
await makeMove(game.gameId, myAddress, 4); // Center position
const updatedGame = await queryGame(game.gameId);
```

### Pattern 2: Multiplayer with Polling (Simple)

**Use case:** Multiplayer where frontend polls for updates

```typescript
const useGame = (gameId: number) => {
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const poll = setInterval(async () => {
      const updated = await queryGame(gameId);
      setGame(updated);
    }, 500); // Poll every 500ms

    return () => clearInterval(poll);
  }, [gameId]);

  return game;
};

// Usage
const game = useGame(currentGameId);
```

### Pattern 3: Multiplayer with Subscriptions (Advanced)

**Use case:** Real-time updates via event streams

```typescript
// This requires WebSocket support in Linera service
// Currently experimental - use polling for now
```

### Pattern 4: Multi-Chain (linot pattern)

**Use case:** Each player has their own chain + shared PLAY_CHAIN

```typescript
// Player 1 setup
const player1Endpoint = `http://localhost:8081/chains/${USER_CHAIN_1}/applications/${APP_ID_1}`;

// Subscribe to PLAY_CHAIN
await mutate(
  player1Endpoint,
  `
  mutation {
    subscribe(playChainId: "${PLAY_CHAIN}")
  }
`
);

// Create game (sends message to PLAY_CHAIN)
await mutate(
  player1Endpoint,
  `
  mutation {
    createMatch(maxPlayers: 2, nickname: "Player 1")
  }
`
);

// Wait for cross-chain message processing
await new Promise((resolve) => setTimeout(resolve, 2000));

// Player 2 joins
const player2Endpoint = `http://localhost:8082/chains/${USER_CHAIN_2}/applications/${APP_ID_2}`;

await mutate(
  player2Endpoint,
  `
  mutation {
    subscribe(playChainId: "${PLAY_CHAIN}")
  }
`
);

await mutate(
  player2Endpoint,
  `
  mutation {
    joinMatch(playChainId: "${PLAY_CHAIN}", nickname: "Player 2")
  }
`
);

// Query PLAY_CHAIN for authoritative state
const playChainEndpoint = `http://localhost:8081/chains/${PLAY_CHAIN}/applications/${APP_ID}`;
const gameState = await query(
  playChainEndpoint,
  `
  query {
    matchState {
      status
      players {
        nickname
        handSize
      }
    }
  }
`
);
```

---

## 8. Common Pitfalls & Solutions

### Issue 1: "client is not configured to propose on chain"

**Cause:** Trying to subscribe to a chain that doesn't have your application bytecode yet.

**Solution:** Send a message to the chain first (which propagates bytecode), wait for confirmation, THEN subscribe.

```rust
// ❌ WRONG
self.runtime.subscribe_to_events(...); // Fails!

// ✅ CORRECT
self.runtime.prepare_message(msg).send_to(chain_id); // Bytecode propagates
// ... wait for confirmation message ...
self.runtime.subscribe_to_events(...); // Now works!
```

### Issue 2: "Failed to load state"

**Cause:** State schema changed but old data exists.

**Solution:**

```bash
# Clear old state
rm -rf /tmp/linera_*
# Or use Docker clean rebuild
docker compose down -v
docker compose up --build
```

### Issue 3: Frontend shows stale data

**Cause:** Cross-chain messages take time to process.

**Solution:** Add delays after mutations:

```typescript
await createGame(...);
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
await fetchGameState();
```

### Issue 4: GraphQL endpoint not found

**Cause:** Service not running or wrong URL.

**Check:**

```bash
# Is service running?
ps aux | grep "linera.*service"

# Correct format:
http://localhost:8080/chains/<64-char-hex>/applications/<64-char-hex>
```

### Issue 5: Can't extract CHAIN_ID from wallet show

**Cause:** Different output format between Linera versions.

**Solution:** Use regex pattern:

```bash
CHAIN_ID=$(linera wallet show | grep -E '^[a-f0-9]{64}$' | head -1)
```

### Issue 6: Player 2 can't join game

**Cause:** PLAY_CHAIN not synced to Player 2's wallet.

**Solution:** Always sync wallets after creating all chains:

```bash
linera --with-wallet 1 sync
linera --with-wallet 2 sync
```

---

## Summary: What You Need to Do

### For Your Drawn Project (Current Single-Player → Multiplayer)

1. **Add Message enum** for cross-chain communication
2. **Implement execute_message** handler
3. **Add event streams** for state updates
4. **Split into USER_CHAIN + PLAY_CHAIN** logic
5. **Update run.bash** to create multiple chains
6. **Add subscription pattern** (message first, then subscribe)
7. **Update frontend** to use multiple GraphQL endpoints

### Priority Order

1. ✅ Keep current single-player working
2. 📝 Add multiplayer architecture (messages, chains)
3. 🧪 Test with 2 wallets locally
4. 🎨 Update frontend for multi-chain
5. 🚀 Deploy with Docker

---

## Resources

- **Linera Docs:** https://linera.dev/developers
- **Reference Projects:**
  - linot-card-game: Best for multiplayer patterns
  - microcard: Best for complex game logic
  - microchess: Best for turn-based games
- **Your Working Examples:** `inspo/` folder

---

**Next Steps:** See `DRAWN_MULTIPLAYER_MIGRATION.md` for step-by-step implementation guide.
