# 🎮 Drawn Backend Analysis & Architecture

> **Current State:** Single-chain Tic-Tac-Toe implementation  
> **Target State:** Multiplayer with USER_CHAIN + PLAY_CHAIN architecture  
> **Based on:** linot-card-game patterns

---

## 📊 Current Backend Architecture

### What You Have

```
contracts/src/
├── lib.rs          ✅ Types defined
├── contract.rs     ✅ Single-chain logic working
├── service.rs      ✅ GraphQL queries working
└── state.rs        ✅ State persistence working
```

### Current Capabilities

**✅ Working:**

- Create games (single or vs AI)
- Make moves with validation
- Track game state (board, turns, winner)
- Player statistics
- GraphQL queries and mutations

**❌ Missing for Multiplayer:**

- Cross-chain messaging
- Event streams
- Subscription mechanism
- Chain type separation (USER vs PLAY)

---

## 🏗️ Architecture Comparison

### Current: Single Chain

```
┌──────────────────────────────────────┐
│         Single Chain                  │
│                                       │
│  State:                               │
│  ├─ games: MapView<u64, Game>        │
│  ├─ player_stats: MapView<...>       │
│  └─ counters                          │
│                                       │
│  Operations:                          │
│  ├─ CreateGame                        │
│  └─ MakeMove                          │
└──────────────────────────────────────┘
         │
         │ GraphQL
         ▼
    Frontend
```

**Issues:**

- All players share same chain
- No real-time sync between players
- No privacy (everyone sees everything)
- Can't scale to many concurrent games

### Target: Multi-Chain (linot pattern)

```
┌────────────────┐      ┌────────────────┐
│ USER_CHAIN_1   │      │ USER_CHAIN_2   │
│ (Player 1)     │      │ (Player 2)     │
│                │      │                │
│ Operations:    │      │ Operations:    │
│ - Subscribe    │      │ - Subscribe    │
│ - JoinGame     │      │ - JoinGame     │
│ - MakeMove     │      │ - MakeMove     │
│                │      │                │
│ State:         │      │ State:         │
│ - my_games     │      │ - my_games     │
│ - user_status  │      │ - user_status  │
└───────┬────────┘      └────────┬───────┘
        │                        │
        │   Messages             │
        └───────────┬────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │   PLAY_CHAIN     │
          │ (Authoritative)  │
          │                  │
          │ Messages:        │
          │ - RequestJoin    │
          │ - MakeMoveAction │
          │ - StartGame      │
          │                  │
          │ State:           │
          │ - active_games   │
          │ - all_players    │
          │                  │
          │ Events:          │
          │ - GameUpdate     │
          │ - TurnChanged    │
          │ - GameEnded      │
          └──────────────────┘
                    │
                    │ Events
                    ▼
         Both USER_CHAINs subscribed
```

**Benefits:**

- Each player has private chain
- PLAY_CHAIN is single source of truth
- Real-time updates via events
- Scales to multiple concurrent games
- Better privacy and security

---

## 🔍 Detailed Comparison with linot

### Your Current Code (Drawn)

**lib.rs:**

```rust
pub enum Operation {
    CreateGame { player_x: String, player_o: Option<String> },
    MakeMove { game_id: u64, player: String, position: u8 },
}

// ❌ Missing: Message enum
// ❌ Missing: UserStatus enum
// ❌ Missing: Event streams
```

**contract.rs:**

```rust
impl Contract for TicTacToeContract {
    type Message = (); // ❌ Not using messages!
    type EventValue = (); // ❌ Not using events!

    async fn execute_operation(&mut self, operation: Operation) -> OperationResponse {
        match operation {
            Operation::CreateGame { .. } => {
                // ❌ Creates game directly on this chain
                // No messaging to PLAY_CHAIN
            }
            Operation::MakeMove { .. } => {
                // ❌ Processes move on this chain
                // No cross-chain coordination
            }
        }
    }

    // ❌ Missing: execute_message handler
}
```

### linot Pattern (Reference)

**lib.rs:**

```rust
pub enum Operation {
    // USER_CHAIN operations
    Subscribe { play_chain_id: ChainId },
    JoinMatch { play_chain_id: ChainId, nickname: String },
    CreateMatch { max_players: u8, nickname: String },

    // Game actions (sent as messages)
    PlayCard { card_index: u8, chosen_suit: Option<CardSuit> },
    DrawCard,
}

pub enum Message {
    // USER_CHAIN → PLAY_CHAIN
    RequestJoinMatch { player_owner: AccountOwner, nickname: String },
    RequestCreateMatch { creator_owner: AccountOwner, max_players: u8, nickname: String },
    PlayCardAction { player_owner: AccountOwner, card_index: u8, chosen_suit: Option<CardSuit> },

    // PLAY_CHAIN → USER_CHAIN
    JoinMatchConfirmed { success: bool },
    CreateMatchConfirmed { success: bool },
}

pub enum GameEvent {
    MatchCreated { match_id: u64 },
    PlayerJoined { player: String },
    CardPlayed { player_index: u8, card: Card },
    MatchEnded { winner: Option<u8> },
}

pub enum UserStatus {
    Idle,
    CreatingMatch,
    WaitingToJoin,
    InMatch,
}
```

**contract.rs:**

```rust
impl Contract for LinotContract {
    type Message = Message; // ✅ Using messages!
    type EventValue = GameEvent; // ✅ Using events!

    async fn execute_operation(&mut self, operation: Operation) -> Response {
        match operation {
            Operation::JoinMatch { play_chain_id, nickname } => {
                // ✅ USER_CHAIN: Send message to PLAY_CHAIN
                let message = Message::RequestJoinMatch { .. };
                self.runtime.prepare_message(message).send_to(play_chain_id);

                // ✅ Don't subscribe yet - wait for confirmation!
                self.state.user_status.set(UserStatus::WaitingToJoin);
            }

            Operation::PlayCard { card_index, chosen_suit } => {
                // ✅ Check if USER_CHAIN or PLAY_CHAIN
                if let Some(play_chain_id) = self.state.subscribed_play_chain.get() {
                    // USER_CHAIN: Send to PLAY_CHAIN
                    let message = Message::PlayCardAction { .. };
                    self.runtime.prepare_message(message).send_to(play_chain_id);
                } else {
                    // PLAY_CHAIN: Process directly
                    self.handle_play_card_on_play_chain(..);
                }
            }
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::RequestJoinMatch { player_owner, nickname } => {
                // ✅ PLAY_CHAIN receives this
                self.handle_join_request(player_owner, nickname).await;

                // Send confirmation back
                let response = Message::JoinMatchConfirmed { success: true };
                self.runtime.prepare_message(response).send_to(player_chain_id);

                // Emit event to all subscribers
                self.runtime.emit(GameEvent::PlayerJoined { player: nickname });
            }

            Message::JoinMatchConfirmed { success } => {
                // ✅ USER_CHAIN receives this
                if success {
                    // NOW subscribe!
                    let play_chain_id = self.state.play_chain_id.get().unwrap();
                    self.runtime.subscribe_to_events(play_chain_id, ..);
                    self.state.user_status.set(UserStatus::InMatch);
                }
            }
        }
    }
}
```

---

## 🎯 What You Need to Add

### 1. Message Enum (lib.rs)

```rust
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    // USER_CHAIN → PLAY_CHAIN
    RequestJoinGame {
        player_owner: AccountOwner,
        player_name: String,
    },

    RequestCreateGame {
        creator_owner: AccountOwner,
        player_name: String,
        is_public: bool, // Allow others to join?
    },

    MakeMoveAction {
        game_id: u64,
        player_owner: AccountOwner,
        position: u8, // 0-8
    },

    // PLAY_CHAIN → USER_CHAIN
    JoinGameConfirmed {
        game_id: u64,
        success: bool,
        message: String,
    },

    CreateGameConfirmed {
        game_id: u64,
        success: bool,
    },

    MoveProcessed {
        game_id: u64,
        success: bool,
        message: String,
    },
}
```

### 2. Event Enum (lib.rs)

```rust
pub const GAME_STREAM_NAME: &[u8] = b"drawn-game-events";

#[derive(Debug, Serialize, Deserialize)]
pub enum GameEvent {
    GameCreated {
        game_id: u64,
        creator: String,
        is_public: bool,
    },

    PlayerJoined {
        game_id: u64,
        player: String,
    },

    MoveMade {
        game_id: u64,
        position: u8,
        player_symbol: PlayerSymbol,
        board: Vec<Option<PlayerSymbol>>,
    },

    TurnChanged {
        game_id: u64,
        next_player: PlayerSymbol,
    },

    GameEnded {
        game_id: u64,
        result: GameResult,
    },
}
```

### 3. UserStatus (lib.rs)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserStatus {
    Idle,                    // Not in any game
    CreatingGame,            // Sent create request, waiting for confirmation
    WaitingToJoin,           // Sent join request, waiting for confirmation
    InGame,                  // Playing a game
    WaitingForOpponent,      // In game, waiting for other player
}
```

### 4. Updated State (state.rs)

```rust
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct TicTacToeState {
    // Existing fields
    pub next_game_id: RegisterView<u64>,
    pub games: MapView<u64, Game>,
    pub player_stats: MapView<String, PlayerStats>,
    pub total_games: RegisterView<u64>,

    // NEW: For USER_CHAIN
    pub user_status: RegisterView<UserStatus>,
    pub subscribed_play_chain: RegisterView<Option<ChainId>>,
    pub player_name: RegisterView<Option<String>>,
    pub my_current_game_id: RegisterView<Option<u64>>,

    // NEW: For tracking chain type
    pub is_play_chain: RegisterView<bool>,
}
```

### 5. Split Contract Logic (contract.rs)

**Helper to determine chain type:**

```rust
impl TicTacToeContract {
    fn is_user_chain(&self) -> bool {
        self.state.subscribed_play_chain.get().is_some()
    }

    fn is_play_chain(&self) -> bool {
        *self.state.is_play_chain.get()
    }
}
```

**Updated execute_operation:**

```rust
async fn execute_operation(&mut self, operation: Operation) -> OperationResponse {
    match operation {
        Operation::Subscribe { play_chain_id } => {
            // USER_CHAIN only
            self.handle_subscribe(play_chain_id).await;
            OperationResponse::Ok
        }

        Operation::CreateGame { player_name, is_public } => {
            // USER_CHAIN: Send message to PLAY_CHAIN
            if self.is_user_chain() {
                self.handle_create_game_request(player_name, is_public).await;
            } else {
                // PLAY_CHAIN: Should receive via message, not operation
                panic!("CreateGame must be sent via message to PLAY_CHAIN");
            }
            OperationResponse::Ok
        }

        Operation::JoinGame { play_chain_id, player_name } => {
            // USER_CHAIN: Send message to PLAY_CHAIN
            self.handle_join_game_request(play_chain_id, player_name).await;
            OperationResponse::Ok
        }

        Operation::MakeMove { game_id, position } => {
            // USER_CHAIN: Send message to PLAY_CHAIN
            if self.is_user_chain() {
                self.handle_move_request(game_id, position).await;
            } else {
                panic!("Move must be sent via message to PLAY_CHAIN");
            }
            OperationResponse::Ok
        }
    }
}
```

**New execute_message:**

```rust
async fn execute_message(&mut self, message: Message) {
    match message {
        // PLAY_CHAIN receives these
        Message::RequestCreateGame { creator_owner, player_name, is_public } => {
            if !self.is_play_chain() {
                return;
            }
            self.handle_create_game_on_play_chain(creator_owner, player_name, is_public).await;
        }

        Message::RequestJoinGame { player_owner, player_name } => {
            if !self.is_play_chain() {
                return;
            }
            self.handle_join_game_on_play_chain(player_owner, player_name).await;
        }

        Message::MakeMoveAction { game_id, player_owner, position } => {
            if !self.is_play_chain() {
                return;
            }
            self.handle_move_on_play_chain(game_id, player_owner, position).await;
        }

        // USER_CHAIN receives these
        Message::CreateGameConfirmed { game_id, success } => {
            if !self.is_user_chain() {
                return;
            }
            self.handle_create_confirmed(game_id, success).await;
        }

        Message::JoinGameConfirmed { game_id, success, message } => {
            if !self.is_user_chain() {
                return;
            }
            self.handle_join_confirmed(game_id, success, message).await;
        }
    }
}
```

### 6. Implementation Handlers

**USER_CHAIN handlers:**

```rust
// Send create game request to PLAY_CHAIN
async fn handle_create_game_request(&mut self, player_name: String, is_public: bool) {
    let play_chain_id = self.state.subscribed_play_chain.get()
        .expect("Must subscribe first");

    let creator_owner = self.runtime.authenticated_signer()
        .expect("Must be authenticated");

    let message = Message::RequestCreateGame {
        creator_owner,
        player_name: player_name.clone(),
        is_public,
    };

    self.runtime.prepare_message(message).send_to(play_chain_id);

    self.state.user_status.set(UserStatus::CreatingGame);
    self.state.player_name.set(Some(player_name));
}

// Receive create confirmation from PLAY_CHAIN
async fn handle_create_confirmed(&mut self, game_id: u64, success: bool) {
    if !success {
        self.state.user_status.set(UserStatus::Idle);
        return;
    }

    self.state.my_current_game_id.set(Some(game_id));
    self.state.user_status.set(UserStatus::WaitingForOpponent);
}

// Send join request to PLAY_CHAIN
async fn handle_join_game_request(&mut self, play_chain_id: ChainId, player_name: String) {
    let player_owner = self.runtime.authenticated_signer()
        .expect("Must be authenticated");

    let message = Message::RequestJoinGame {
        player_owner,
        player_name: player_name.clone(),
    };

    self.runtime.prepare_message(message).send_to(play_chain_id);

    // DON'T subscribe yet - wait for confirmation!
    self.state.user_status.set(UserStatus::WaitingToJoin);
    self.state.player_name.set(Some(player_name));
}

// Receive join confirmation from PLAY_CHAIN
async fn handle_join_confirmed(&mut self, game_id: u64, success: bool, msg: String) {
    if !success {
        log::warn!("Join rejected: {}", msg);
        self.state.user_status.set(UserStatus::Idle);
        return;
    }

    // NOW subscribe - PLAY_CHAIN has bytecode now!
    let play_chain_id = self.state.subscribed_play_chain.get().unwrap();
    let app_id = self.runtime.application_id().forget_abi();

    self.runtime.subscribe_to_events(
        play_chain_id,
        app_id,
        GAME_STREAM_NAME.into()
    );

    self.state.my_current_game_id.set(Some(game_id));
    self.state.user_status.set(UserStatus::InGame);
}
```

**PLAY_CHAIN handlers:**

```rust
// Receive create request from USER_CHAIN
async fn handle_create_game_on_play_chain(
    &mut self,
    creator_owner: AccountOwner,
    player_name: String,
    is_public: bool
) {
    let game_id = *self.state.next_game_id.get();

    let game = Game {
        game_id,
        player_x: creator_owner.to_string(),
        player_o: String::new(), // Empty until someone joins
        board: vec![None; 9],
        current_turn: PlayerSymbol::X,
        status: GameStatus::WaitingForPlayers,
        created_at: self.runtime.system_time().micros(),
        winner: None,
    };

    self.state.games.insert(&game_id, game).expect("Failed to insert");
    self.state.next_game_id.set(game_id + 1);

    // Send confirmation back to creator
    let creator_chain_id = ChainId::from(creator_owner); // Simplification
    let message = Message::CreateGameConfirmed {
        game_id,
        success: true,
    };
    self.runtime.prepare_message(message).send_to(creator_chain_id);

    // Emit event
    self.runtime.emit(GameEvent::GameCreated {
        game_id,
        creator: player_name,
        is_public,
    });
}

// Receive join request from USER_CHAIN
async fn handle_join_game_on_play_chain(
    &mut self,
    player_owner: AccountOwner,
    player_name: String
) {
    // Find first available game
    let game_id = self.find_available_game().await;

    if game_id.is_none() {
        // No games available
        let player_chain_id = ChainId::from(player_owner);
        let message = Message::JoinGameConfirmed {
            game_id: 0,
            success: false,
            message: "No games available".to_string(),
        };
        self.runtime.prepare_message(message).send_to(player_chain_id);
        return;
    }

    let game_id = game_id.unwrap();
    let mut game = self.state.games.get(&game_id).await.unwrap().unwrap();

    // Assign as Player O
    game.player_o = player_owner.to_string();
    game.status = GameStatus::Active;
    self.state.games.insert(&game_id, game).expect("Failed to update");

    // Send confirmation
    let player_chain_id = ChainId::from(player_owner);
    let message = Message::JoinGameConfirmed {
        game_id,
        success: true,
        message: "Joined successfully".to_string(),
    };
    self.runtime.prepare_message(message).send_to(player_chain_id);

    // Emit event
    self.runtime.emit(GameEvent::PlayerJoined {
        game_id,
        player: player_name,
    });
}

// Receive move from USER_CHAIN
async fn handle_move_on_play_chain(
    &mut self,
    game_id: u64,
    player_owner: AccountOwner,
    position: u8
) {
    // Validate and process move (same logic as before)
    let mut game = self.state.games.get(&game_id).await.unwrap().unwrap();

    // ... validation logic ...

    game.board[position as usize] = Some(player_symbol);

    // Check winner
    if let Some(winner_symbol) = self.check_winner(&game.board) {
        game.status = match winner_symbol {
            PlayerSymbol::X => GameStatus::XWins,
            PlayerSymbol::O => GameStatus::OWins,
        };
        game.winner = Some(game.player_x.clone()); // Simplification
    }

    self.state.games.insert(&game_id, game.clone()).expect("Failed");

    // Emit events
    self.runtime.emit(GameEvent::MoveMade {
        game_id,
        position,
        player_symbol,
        board: game.board.clone(),
    });

    if game.status != GameStatus::Active {
        self.runtime.emit(GameEvent::GameEnded {
            game_id,
            result: GameResult::Winner(game.winner.unwrap()),
        });
    }
}
```

---

## 🚀 Migration Steps

### Phase 1: Keep Current Working

1. ✅ Don't touch existing code yet
2. ✅ Create new branch: `git checkout -b feature/multiplayer`

### Phase 2: Add Types

1. Add `Message` enum to lib.rs
2. Add `GameEvent` enum to lib.rs
3. Add `UserStatus` enum to lib.rs
4. Update `Contract` trait types:
   ```rust
   type Message = Message; // was ()
   type EventValue = GameEvent; // was ()
   ```

### Phase 3: Update State

1. Add new fields to `TicTacToeState`
2. Update `instantiate` to initialize new fields

### Phase 4: Add Handlers

1. Create `chains/` folder with `user_chain.rs` and `play_chain.rs`
2. Implement USER_CHAIN handlers
3. Implement PLAY_CHAIN handlers
4. Add `execute_message` implementation

### Phase 5: Update Deployment

1. Update `run.bash` to create multiple chains
2. Test with 2 players locally

### Phase 6: Update Frontend

1. Add multi-endpoint support
2. Add subscription management
3. Test end-to-end flow

---

## 📝 Next Steps

1. **Review this analysis** - Understand the differences
2. **Study linot code** - See working implementation in `inspo/linot-card-game/`
3. **Start migration** - Follow phases above
4. **Test incrementally** - Verify each phase works
5. **Update frontend** - Connect to new backend

**Ready to start?** See `DRAWN_MULTIPLAYER_IMPLEMENTATION.md` for code examples.
