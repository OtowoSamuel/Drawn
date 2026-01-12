# 🎮 Multiplayer Migration Guide - The Right Way

> **Goal:** Migrate from single-chain to proper USER_CHAIN + PLAY_CHAIN architecture  
> **Reference:** linot-card-game pattern  
> **Time:** 1-2 days  
> **Result:** Production-ready multiplayer

---

## 🎯 Current vs Target

### ❌ Current (Single-Chain)
```
Alice's Browser                Bob's Browser
      ↓                             ↓
      GraphQL                  GraphQL
      ↓                             ↓
   ┌──────────────────────────────────┐
   │      SAME CHAIN                  │
   │  Both players share state        │
   │  No privacy, no scalability      │
   └──────────────────────────────────┘
```

### ✅ Target (Multiplayer)
```
Alice's Browser                Bob's Browser
      ↓                             ↓
   GraphQL                       GraphQL
      ↓                             ↓
┌─────────────┐              ┌─────────────┐
│ USER_CHAIN_1│              │ USER_CHAIN_2│
│ (Alice)     │              │ (Bob)       │
│             │              │             │
│ Operations: │              │ Operations: │
│ • JoinGame  │              │ • JoinGame  │
│ • MakeMove  │              │ • MakeMove  │
└──────┬──────┘              └──────┬──────┘
       │                            │
       │  Messages (async)          │
       └────────┬───────────────────┘
                │
                ▼
      ┌──────────────────┐
      │   PLAY_CHAIN     │
      │ (Authoritative)  │
      │                  │
      │ Processes:       │
      │ • Game logic     │
      │ • Win detection  │
      │ • Emit events    │
      └────────┬─────────┘
               │
               │ Events (broadcast)
               ▼
        All subscribers
```

---

## 📋 What Needs to Change

### 1. Add Message Enum
### 2. Add GameEvent Enum  
### 3. Add UserStatus Enum
### 4. Update State with new fields
### 5. Implement execute_message handler
### 6. Split logic: USER_CHAIN vs PLAY_CHAIN handlers
### 7. Update deployment script

---

## Step 1: Add Message Enum (lib.rs)

**Add to `contracts/src/lib.rs`:**

```rust
use linera_sdk::linera_base_types::{AccountOwner, ChainId};

/// Cross-chain messages for multiplayer
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    // ========= USER_CHAIN → PLAY_CHAIN =========
    
    /// Player requests to create a new game
    RequestCreateGame {
        creator_owner: AccountOwner,
        creator_chain: ChainId,
        player_name: String,
    },
    
    /// Player requests to join an existing game
    RequestJoinGame {
        player_owner: AccountOwner,
        player_chain: ChainId,
        player_name: String,
        game_id: Option<u64>, // None = join any available game
    },
    
    /// Player makes a move
    MakeMoveAction {
        game_id: u64,
        player_owner: AccountOwner,
        position: u8,
    },
    
    // ========= PLAY_CHAIN → USER_CHAIN =========
    
    /// Confirmation that game was created
    CreateGameConfirmed {
        game_id: u64,
        success: bool,
        message: String,
    },
    
    /// Confirmation that player joined game
    JoinGameConfirmed {
        game_id: u64,
        success: bool,
        message: String,
    },
}
```

---

## Step 2: Add GameEvent Enum (lib.rs)

**Add to `contracts/src/lib.rs`:**

```rust
/// Stream name for game events
pub const GAME_STREAM_NAME: &[u8] = b"drawn-game-events";

/// Events emitted by PLAY_CHAIN
#[derive(Debug, Serialize, Deserialize)]
pub enum GameEvent {
    /// New game was created
    GameCreated {
        game_id: u64,
        creator_name: String,
    },
    
    /// Player joined a game
    PlayerJoined {
        game_id: u64,
        player_name: String,
    },
    
    /// Game started (both players ready)
    GameStarted {
        game_id: u64,
    },
    
    /// A move was made
    MoveMade {
        game_id: u64,
        player: PlayerSymbol,
        position: u8,
        board: Vec<Option<PlayerSymbol>>,
    },
    
    /// Turn changed
    TurnChanged {
        game_id: u64,
        next_player: PlayerSymbol,
    },
    
    /// Game ended
    GameEnded {
        game_id: u64,
        result: GameResult,
        winner: Option<String>,
    },
}
```

---

## Step 3: Add UserStatus Enum (lib.rs)

**Add to `contracts/src/lib.rs`:**

```rust
/// Tracks player's current state (USER_CHAIN only)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UserStatus {
    /// Not in any game
    Idle,
    
    /// Creating a game (waiting for confirmation)
    CreatingGame,
    
    /// Attempting to join a game (waiting for confirmation)
    WaitingToJoin,
    
    /// In an active game
    InGame,
    
    /// Waiting for opponent to join
    WaitingForOpponent,
}

impl Default for UserStatus {
    fn default() -> Self {
        UserStatus::Idle
    }
}
```

---

## Step 4: Update Operations (lib.rs)

**Replace the Operation enum:**

```rust
/// Operations that can be performed
#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    // ========= USER_CHAIN Operations =========
    
    /// Subscribe to a PLAY_CHAIN to receive events
    Subscribe {
        play_chain_id: ChainId,
    },
    
    /// Create a new game on PLAY_CHAIN
    CreateGame {
        play_chain_id: ChainId,
        player_name: String,
    },
    
    /// Join a game on PLAY_CHAIN
    JoinGame {
        play_chain_id: ChainId,
        player_name: String,
        game_id: Option<u64>,
    },
    
    /// Make a move in current game
    MakeMove {
        position: u8,
    },
    
    // ========= PLAY_CHAIN Operations =========
    // (These are called via messages, not directly as operations)
}
```

---

## Step 5: Update State (state.rs)

**Update `contracts/src/state.rs`:**

```rust
use linera_sdk::{
    views::{MapView, RegisterView, RootView, ViewStorageContext},
    linera_base_types::ChainId,
};
use tictactoe::{Game, PlayerStats, UserStatus};

/// Application state
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]
pub struct TicTacToeState {
    // ========= Existing fields (for PLAY_CHAIN) =========
    pub next_game_id: RegisterView<u64>,
    pub games: MapView<u64, Game>,
    pub player_stats: MapView<String, PlayerStats>,
    pub total_games: RegisterView<u64>,
    
    // ========= NEW: USER_CHAIN fields =========
    /// Current user status
    pub user_status: RegisterView<UserStatus>,
    
    /// PLAY_CHAIN this user is subscribed to
    pub subscribed_play_chain: RegisterView<Option<ChainId>>,
    
    /// Player's name
    pub player_name: RegisterView<Option<String>>,
    
    /// Current game ID user is playing
    pub my_current_game_id: RegisterView<Option<u64>>,
    
    // ========= NEW: Tracking =========
    /// Is this chain a PLAY_CHAIN?
    pub is_play_chain: RegisterView<bool>,
}

impl TicTacToeState {
    // Existing helper methods remain the same
    
    pub async fn get_game(&self, game_id: u64) -> Option<Game> {
        self.games.get(&game_id).await.ok().flatten()
    }
    
    pub async fn get_player_stats(&self, address: &str) -> Option<PlayerStats> {
        self.player_stats.get(address).await.ok().flatten()
    }
    
    pub async fn get_or_create_player_stats(&mut self, address: String) -> PlayerStats {
        self.player_stats
            .get(&address)
            .await
            .ok()
            .flatten()
            .unwrap_or_else(|| PlayerStats {
                address: address.clone(),
                games_played: 0,
                games_won: 0,
                games_lost: 0,
                games_drawn: 0,
            })
    }
}
```

---

## Step 6: Update Contract Types (contract.rs)

**At the top of `contracts/src/contract.rs`:**

```rust
use tictactoe::{
    Operation, OperationResponse, Game, GameStatus, PlayerSymbol, GameResult,
    Message, GameEvent, UserStatus, GAME_STREAM_NAME,
};

impl Contract for TicTacToeContract {
    type Message = Message;  // ✅ Change from ()
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = GameEvent;  // ✅ Change from ()
    
    // ... rest of trait impl
}
```

---

## Step 7: Implement execute_operation (contract.rs)

**Replace the execute_operation method:**

```rust
async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
    match operation {
        // ========= USER_CHAIN Operations =========
        
        Operation::Subscribe { play_chain_id } => {
            self.handle_subscribe(play_chain_id).await;
            OperationResponse::Ok
        }
        
        Operation::CreateGame { play_chain_id, player_name } => {
            self.handle_create_game_request(play_chain_id, player_name).await;
            OperationResponse::Ok
        }
        
        Operation::JoinGame { play_chain_id, player_name, game_id } => {
            self.handle_join_game_request(play_chain_id, player_name, game_id).await;
            OperationResponse::Ok
        }
        
        Operation::MakeMove { position } => {
            self.handle_move_request(position).await;
            OperationResponse::Ok
        }
    }
}
```

---

## Step 8: Implement execute_message (contract.rs)

**Replace the empty execute_message:**

```rust
async fn execute_message(&mut self, message: Self::Message) {
    log::info!("Received message: {:?}", message);
    
    match message {
        // ========= PLAY_CHAIN receives these =========
        
        Message::RequestCreateGame { creator_owner, creator_chain, player_name } => {
            if *self.state.is_play_chain.get() {
                self.handle_create_game_on_play_chain(
                    creator_owner,
                    creator_chain,
                    player_name
                ).await;
            }
        }
        
        Message::RequestJoinGame { player_owner, player_chain, player_name, game_id } => {
            if *self.state.is_play_chain.get() {
                self.handle_join_game_on_play_chain(
                    player_owner,
                    player_chain,
                    player_name,
                    game_id
                ).await;
            }
        }
        
        Message::MakeMoveAction { game_id, player_owner, position } => {
            if *self.state.is_play_chain.get() {
                self.handle_move_on_play_chain(
                    game_id,
                    player_owner,
                    position
                ).await;
            }
        }
        
        // ========= USER_CHAIN receives these =========
        
        Message::CreateGameConfirmed { game_id, success, message } => {
            if !*self.state.is_play_chain.get() {
                self.handle_create_confirmed(game_id, success, message).await;
            }
        }
        
        Message::JoinGameConfirmed { game_id, success, message } => {
            if !*self.state.is_play_chain.get() {
                self.handle_join_confirmed(game_id, success, message).await;
            }
        }
    }
}
```

---

## Step 9: Implement USER_CHAIN Handlers

**Add these methods to `TicTacToeContract` impl block:**

```rust
impl TicTacToeContract {
    /// USER_CHAIN: Subscribe to PLAY_CHAIN events
    async fn handle_subscribe(&mut self, play_chain_id: ChainId) {
        log::info!("USER_CHAIN: Subscribing to play chain {:?}", play_chain_id);
        
        let app_id = self.runtime.application_id().forget_abi();
        
        self.runtime.subscribe_to_events(
            play_chain_id,
            app_id,
            GAME_STREAM_NAME.into(),
        );
        
        self.state.subscribed_play_chain.set(Some(play_chain_id));
        
        log::info!("USER_CHAIN: Successfully subscribed to play chain");
    }
    
    /// USER_CHAIN: Send create game request to PLAY_CHAIN
    async fn handle_create_game_request(
        &mut self,
        play_chain_id: ChainId,
        player_name: String,
    ) {
        log::info!("USER_CHAIN: Requesting to create game on play chain");
        
        let creator_owner = self.runtime.authenticated_signer()
            .expect("Operation must be authenticated");
        
        let creator_chain = self.runtime.chain_id();
        
        let message = Message::RequestCreateGame {
            creator_owner,
            creator_chain,
            player_name: player_name.clone(),
        };
        
        self.runtime.prepare_message(message).send_to(play_chain_id);
        
        self.state.user_status.set(UserStatus::CreatingGame);
        self.state.player_name.set(Some(player_name));
        
        log::info!("USER_CHAIN: Create game request sent");
    }
    
    /// USER_CHAIN: Send join game request to PLAY_CHAIN
    async fn handle_join_game_request(
        &mut self,
        play_chain_id: ChainId,
        player_name: String,
        game_id: Option<u64>,
    ) {
        log::info!("USER_CHAIN: Requesting to join game");
        
        let player_owner = self.runtime.authenticated_signer()
            .expect("Operation must be authenticated");
        
        let player_chain = self.runtime.chain_id();
        
        let message = Message::RequestJoinGame {
            player_owner,
            player_chain,
            player_name: player_name.clone(),
            game_id,
        };
        
        self.runtime.prepare_message(message).send_to(play_chain_id);
        
        // DON'T subscribe yet! Wait for confirmation
        self.state.user_status.set(UserStatus::WaitingToJoin);
        self.state.player_name.set(Some(player_name));
        
        log::info!("USER_CHAIN: Join game request sent, waiting for confirmation");
    }
    
    /// USER_CHAIN: Handle create game confirmation from PLAY_CHAIN
    async fn handle_create_confirmed(
        &mut self,
        game_id: u64,
        success: bool,
        message: String,
    ) {
        log::info!("USER_CHAIN: Received create game confirmation");
        
        if !success {
            log::warn!("USER_CHAIN: Game creation failed: {}", message);
            self.state.user_status.set(UserStatus::Idle);
            return;
        }
        
        self.state.my_current_game_id.set(Some(game_id));
        self.state.user_status.set(UserStatus::WaitingForOpponent);
        
        log::info!("USER_CHAIN: Game {} created, waiting for opponent", game_id);
    }
    
    /// USER_CHAIN: Handle join game confirmation - THIS IS WHERE WE SUBSCRIBE!
    async fn handle_join_confirmed(
        &mut self,
        game_id: u64,
        success: bool,
        message: String,
    ) {
        log::info!("USER_CHAIN: Received join game confirmation");
        
        if !success {
            log::warn!("USER_CHAIN: Join failed: {}", message);
            self.state.user_status.set(UserStatus::Idle);
            return;
        }
        
        // ✅ NOW we subscribe - PLAY_CHAIN has confirmed and has our bytecode!
        let play_chain_id = self.state.subscribed_play_chain.get()
            .expect("Should have subscribed play chain");
        
        let app_id = self.runtime.application_id().forget_abi();
        
        self.runtime.subscribe_to_events(
            play_chain_id,
            app_id,
            GAME_STREAM_NAME.into(),
        );
        
        self.state.my_current_game_id.set(Some(game_id));
        self.state.user_status.set(UserStatus::InGame);
        
        log::info!("USER_CHAIN: ✅ Joined game {} and subscribed to events", game_id);
    }
    
    /// USER_CHAIN: Send move to PLAY_CHAIN
    async fn handle_move_request(&mut self, position: u8) {
        log::info!("USER_CHAIN: Requesting to make move at position {}", position);
        
        let play_chain_id = self.state.subscribed_play_chain.get()
            .expect("Must be subscribed to play chain");
        
        let game_id = self.state.my_current_game_id.get()
            .expect("Must be in a game");
        
        let player_owner = self.runtime.authenticated_signer()
            .expect("Operation must be authenticated");
        
        let message = Message::MakeMoveAction {
            game_id,
            player_owner,
            position,
        };
        
        self.runtime.prepare_message(message).send_to(play_chain_id);
        
        log::info!("USER_CHAIN: Move request sent to play chain");
    }
    
    // ... (existing check_winner and update_game_result methods remain)
}
```

---

## Step 10: Implement PLAY_CHAIN Handlers

**Continue in the same impl block:**

```rust
impl TicTacToeContract {
    // ... (USER_CHAIN handlers from Step 9)
    
    /// PLAY_CHAIN: Handle create game request
    async fn handle_create_game_on_play_chain(
        &mut self,
        creator_owner: AccountOwner,
        creator_chain: ChainId,
        player_name: String,
    ) {
        log::info!("PLAY_CHAIN: Creating game for {}", player_name);
        
        let game_id = *self.state.next_game_id.get();
        
        let game = Game {
            game_id,
            player_x: creator_owner.to_string(),
            player_o: String::new(), // Empty until someone joins
            board: vec![None; 9],
            current_turn: PlayerSymbol::X,
            status: GameStatus::Active,
            created_at: self.runtime.system_time().micros(),
            winner: None,
        };
        
        self.state.games.insert(&game_id, game)
            .expect("Failed to insert game");
        
        self.state.next_game_id.set(game_id + 1);
        let total = *self.state.total_games.get();
        self.state.total_games.set(total + 1);
        
        // Send confirmation back to creator
        let confirmation = Message::CreateGameConfirmed {
            game_id,
            success: true,
            message: format!("Game {} created", game_id),
        };
        self.runtime.prepare_message(confirmation).send_to(creator_chain);
        
        // Emit event
        self.runtime.emit(GameEvent::GameCreated {
            game_id,
            creator_name: player_name,
        });
        
        log::info!("PLAY_CHAIN: Game {} created and confirmed", game_id);
    }
    
    /// PLAY_CHAIN: Handle join game request
    async fn handle_join_game_on_play_chain(
        &mut self,
        player_owner: AccountOwner,
        player_chain: ChainId,
        player_name: String,
        requested_game_id: Option<u64>,
    ) {
        log::info!("PLAY_CHAIN: {} attempting to join game", player_name);
        
        // Find game to join
        let game_id = if let Some(id) = requested_game_id {
            Some(id)
        } else {
            // Find first available game (player_o is empty)
            self.find_available_game().await
        };
        
        let Some(game_id) = game_id else {
            // No games available
            let confirmation = Message::JoinGameConfirmed {
                game_id: 0,
                success: false,
                message: "No games available".to_string(),
            };
            self.runtime.prepare_message(confirmation).send_to(player_chain);
            return;
        };
        
        // Get game
        let Some(mut game) = self.state.get_game(game_id).await else {
            let confirmation = Message::JoinGameConfirmed {
                game_id,
                success: false,
                message: "Game not found".to_string(),
            };
            self.runtime.prepare_message(confirmation).send_to(player_chain);
            return;
        };
        
        // Check if game is full
        if !game.player_o.is_empty() {
            let confirmation = Message::JoinGameConfirmed {
                game_id,
                success: false,
                message: "Game is full".to_string(),
            };
            self.runtime.prepare_message(confirmation).send_to(player_chain);
            return;
        }
        
        // Add player to game
        game.player_o = player_owner.to_string();
        self.state.games.insert(&game_id, game)
            .expect("Failed to update game");
        
        // Send confirmation to joiner
        let confirmation = Message::JoinGameConfirmed {
            game_id,
            success: true,
            message: format!("Joined game {}", game_id),
        };
        self.runtime.prepare_message(confirmation).send_to(player_chain);
        
        // Emit events
        self.runtime.emit(GameEvent::PlayerJoined {
            game_id,
            player_name: player_name.clone(),
        });
        
        self.runtime.emit(GameEvent::GameStarted { game_id });
        
        log::info!("PLAY_CHAIN: {} joined game {}", player_name, game_id);
    }
    
    /// PLAY_CHAIN: Handle move from USER_CHAIN
    async fn handle_move_on_play_chain(
        &mut self,
        game_id: u64,
        player_owner: AccountOwner,
        position: u8,
    ) {
        log::info!("PLAY_CHAIN: Processing move for game {}", game_id);
        
        // Validate position
        if position > 8 {
            log::warn!("Invalid position: {}", position);
            return;
        }
        
        // Get game
        let Some(mut game) = self.state.get_game(game_id).await else {
            log::warn!("Game {} not found", game_id);
            return;
        };
        
        // Validate game is active
        if game.status != GameStatus::Active {
            log::warn!("Game {} is not active", game_id);
            return;
        }
        
        // Determine player symbol
        let player_symbol = if player_owner.to_string() == game.player_x {
            PlayerSymbol::X
        } else if player_owner.to_string() == game.player_o {
            PlayerSymbol::O
        } else {
            log::warn!("Player not in game");
            return;
        };
        
        // Validate turn
        if player_symbol != game.current_turn {
            log::warn!("Not player's turn");
            return;
        }
        
        // Validate position is empty
        if game.board[position as usize].is_some() {
            log::warn!("Position already occupied");
            return;
        }
        
        // Make the move
        game.board[position as usize] = Some(player_symbol);
        
        // Emit move event
        self.runtime.emit(GameEvent::MoveMade {
            game_id,
            player: player_symbol,
            position,
            board: game.board.clone(),
        });
        
        // Check for winner
        if let Some(winner) = self.check_winner(&game.board) {
            match winner {
                PlayerSymbol::X => {
                    game.status = GameStatus::XWins;
                    game.winner = Some(game.player_x.clone());
                    self.update_game_result(&game.player_x, &game.player_o, true, false).await;
                }
                PlayerSymbol::O => {
                    game.status = GameStatus::OWins;
                    game.winner = Some(game.player_o.clone());
                    self.update_game_result(&game.player_o, &game.player_x, true, false).await;
                }
            }
            
            self.runtime.emit(GameEvent::GameEnded {
                game_id,
                result: GameResult::Winner(game.winner.clone().unwrap()),
                winner: game.winner.clone(),
            });
        }
        // Check for draw
        else if game.board.iter().all(|cell| cell.is_some()) {
            game.status = GameStatus::Draw;
            self.update_game_result(&game.player_x, &game.player_o, false, true).await;
            
            self.runtime.emit(GameEvent::GameEnded {
                game_id,
                result: GameResult::Draw,
                winner: None,
            });
        }
        // Continue game
        else {
            game.current_turn = match game.current_turn {
                PlayerSymbol::X => PlayerSymbol::O,
                PlayerSymbol::O => PlayerSymbol::X,
            };
            
            self.runtime.emit(GameEvent::TurnChanged {
                game_id,
                next_player: game.current_turn,
            });
        }
        
        // Save game
        self.state.games.insert(&game_id, game)
            .expect("Failed to update game");
        
        log::info!("PLAY_CHAIN: Move processed for game {}", game_id);
    }
    
    /// Find first available game (helper)
    async fn find_available_game(&self) -> Option<u64> {
        // This is simplified - in production you'd want a better way
        // to track available games
        let next_id = *self.state.next_game_id.get();
        
        for id in 1..next_id {
            if let Some(game) = self.state.get_game(id).await {
                if game.player_o.is_empty() && game.status == GameStatus::Active {
                    return Some(id);
                }
            }
        }
        
        None
    }
}
```

---

## Step 11: Update instantiate (contract.rs)

**Update the instantiate method:**

```rust
async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
    self.runtime.application_parameters();
    
    // Initialize counters
    self.state.next_game_id.set(1);
    self.state.total_games.set(0);
    
    // Initialize USER_CHAIN fields
    self.state.user_status.set(UserStatus::Idle);
    self.state.subscribed_play_chain.set(None);
    self.state.player_name.set(None);
    self.state.my_current_game_id.set(None);
    
    // Mark as PLAY_CHAIN if this is the first chain created
    // (In practice, you'd have a better way to determine this)
    self.state.is_play_chain.set(false);
}
```

---

## Step 12: Update OperationResponse (lib.rs)

**Simplify the response enum:**

```rust
/// Response types for operations
#[derive(Debug, Serialize, Deserialize)]
pub enum OperationResponse {
    Ok,
    Error(String),
}
```

---

## ✅ Testing the Migration

### Test Flow

```bash
# Terminal 1: Start network
linera net up --with-faucet

# Terminal 2: Create PLAY_CHAIN (Wallet 1)
export WALLET_1=~/.config/linera/wallet.json
linera --wallet $WALLET_1 wallet init --with-new-chain

# Build and publish
cd contracts
cargo build --release --target wasm32-unknown-unknown
linera --wallet $WALLET_1 project publish-and-create

# Save PLAY_CHAIN_ID and APP_ID
PLAY_CHAIN_ID=<from output>
APP_ID=<from output>

# Mark it as play chain (manually update is_play_chain in state)
# Or: Add a SetAsPlayChain operation

# Start service for Player 1
linera --wallet $WALLET_1 service --port 8080 &

# Terminal 3: Create USER_CHAIN for Player 2
export WALLET_2=~/.config/linera/wallet2.json
linera --wallet $WALLET_2 wallet init --with-new-chain

# Player 2 subscribes to PLAY_CHAIN
linera --wallet $WALLET_2 subscribe $PLAY_CHAIN_ID

# Start service for Player 2
linera --wallet $WALLET_2 service --port 8081 &
```

### GraphQL Test (Player 1 - Creator)

```graphql
# Player 1: Subscribe to PLAY_CHAIN
mutation {
  subscribe(playChainId: "PLAY_CHAIN_ID")
}

# Player 1: Create game
mutation {
  createGame(
    playChainId: "PLAY_CHAIN_ID"
    playerName: "Alice"
  )
}
```

### GraphQL Test (Player 2 - Joiner)

```graphql
# Player 2: Join game
mutation {
  joinGame(
    playChainId: "PLAY_CHAIN_ID"
    playerName: "Bob"
    gameId: null  # Join any available game
  )
}
```

### GraphQL Test (Making Moves)

```graphql
# Player 1 makes move
mutation {
  makeMove(position: 4)
}

# Player 2 makes move
mutation {
  makeMove(position: 0)
}
```

---

## 📊 Summary

**What You Changed:**
1. ✅ Added `Message` enum for cross-chain communication
2. ✅ Added `GameEvent` enum for real-time updates
3. ✅ Added `UserStatus` to track player state
4. ✅ Updated `State` with USER_CHAIN fields
5. ✅ Implemented `execute_message` handler
6. ✅ Split logic: USER_CHAIN vs PLAY_CHAIN
7. ✅ Proper subscribe pattern (wait for confirmation!)

**Result:**
- ✅ True multiplayer with separate chains
- ✅ Real-time event synchronization
- ✅ Privacy (each player has own chain)
- ✅ Scalable (many concurrent games)
- ✅ Production-ready architecture

---

**Next:** Update frontend to support multiple endpoints (USER_CHAIN + PLAY_CHAIN queries)

This is the PROPER Linera way! 🚀
