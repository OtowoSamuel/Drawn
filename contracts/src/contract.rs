#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use tictactoe::{Operation, OperationResponse, Game, GameStatus, PlayerSymbol, GameResult};
use self::state::TicTacToeState;

pub struct TicTacToeContract {
    state: TicTacToeState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(TicTacToeContract);

impl WithContractAbi for TicTacToeContract {
    type Abi = tictactoe::TicTacToeAbi;
}

impl Contract for TicTacToeContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = TicTacToeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        TicTacToeContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
        // Initialize with game ID starting at 1
        self.state.next_game_id.set(1);
        self.state.total_games.set(0);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::CreateGame { player_x, player_o } => {
                // Get next game ID
                let game_id = *self.state.next_game_id.get();
                
                // Determine player O (either provided or "AI")
                let player_o_addr = player_o.unwrap_or_else(|| "AI".to_string());
                
                // Create new game with empty board
                let game = Game {
                    game_id,
                    player_x: player_x.clone(),
                    player_o: player_o_addr.clone(),
                    board: vec![None; 9], // Empty 3x3 board
                    current_turn: PlayerSymbol::X,
                    status: GameStatus::Active,
                    created_at: self.runtime.system_time().micros(),
                    winner: None,
                };
                
                // Store game
                self.state.games.insert(&game_id, game).expect("Failed to insert game");
                
                // Update player statistics
                let mut stats_x = self.state.get_or_create_player_stats(player_x.clone()).await;
                stats_x.games_played += 1;
                self.state.player_stats.insert(&player_x, stats_x).expect("Failed to update player X stats");
                
                if player_o_addr != "AI" {
                    let mut stats_o = self.state.get_or_create_player_stats(player_o_addr.clone()).await;
                    stats_o.games_played += 1;
                    self.state.player_stats.insert(&player_o_addr, stats_o).expect("Failed to update player O stats");
                }
                
                // Increment counters
                self.state.next_game_id.set(game_id + 1);
                let total = *self.state.total_games.get();
                self.state.total_games.set(total + 1);
                
                OperationResponse::GameCreated(game_id)
            }
            
            Operation::MakeMove { game_id, player, position } => {
                // Validate position
                if position > 8 {
                    panic!("Invalid position: must be 0-8");
                }
                
                // Get game
                let mut game = self.state.get_game(game_id).await
                    .expect("Game not found");
                
                // Validate game is active
                if game.status != GameStatus::Active {
                    panic!("Game is not active");
                }
                
                // Validate it's the player's turn
                let player_symbol = if player == game.player_x {
                    PlayerSymbol::X
                } else if player == game.player_o {
                    PlayerSymbol::O
                } else {
                    panic!("Player not in this game");
                };
                
                if player_symbol != game.current_turn {
                    panic!("Not your turn");
                }
                
                // Validate position is empty
                if game.board[position as usize].is_some() {
                    panic!("Position already occupied");
                }
                
                // Make the move
                game.board[position as usize] = Some(player_symbol);
                
                // Check for winner
                if let Some(winner) = self.check_winner(&game.board) {
                    match winner {
                        PlayerSymbol::X => {
                            game.status = GameStatus::XWins;
                            game.winner = Some(game.player_x.clone());
                            // Update stats
                            self.update_game_result(&game.player_x, &game.player_o, true, false).await;
                        }
                        PlayerSymbol::O => {
                            game.status = GameStatus::OWins;
                            game.winner = Some(game.player_o.clone());
                            // Update stats
                            self.update_game_result(&game.player_o, &game.player_x, true, false).await;
                        }
                    }
                    
                    // Update game
                    self.state.games.insert(&game_id, game.clone()).expect("Failed to update game");
                    
                    return OperationResponse::GameEnded(GameResult::Winner(game.winner.unwrap()));
                }
                
                // Check for draw
                if game.board.iter().all(|cell| cell.is_some()) {
                    game.status = GameStatus::Draw;
                    // Update stats for both players
                    self.update_game_result(&game.player_x, &game.player_o, false, true).await;
                    
                    // Update game
                    self.state.games.insert(&game_id, game).expect("Failed to update game");
                    
                    return OperationResponse::GameEnded(GameResult::Draw);
                }
                
                // Switch turn
                game.current_turn = match game.current_turn {
                    PlayerSymbol::X => PlayerSymbol::O,
                    PlayerSymbol::O => PlayerSymbol::X,
                };
                
                // Update game
                self.state.games.insert(&game_id, game).expect("Failed to update game");
                
                OperationResponse::MoveMade
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl TicTacToeContract {
    /// Check if there's a winner on the board
    fn check_winner(&self, board: &[Option<PlayerSymbol>]) -> Option<PlayerSymbol> {
        // Winning combinations (row, col, diagonal indices)
        let winning_combinations = [
            [0, 1, 2], // Top row
            [3, 4, 5], // Middle row
            [6, 7, 8], // Bottom row
            [0, 3, 6], // Left column
            [1, 4, 7], // Middle column
            [2, 5, 8], // Right column
            [0, 4, 8], // Diagonal top-left to bottom-right
            [2, 4, 6], // Diagonal top-right to bottom-left
        ];
        
        for combo in &winning_combinations {
            if let (Some(a), Some(b), Some(c)) = (
                board[combo[0]],
                board[combo[1]],
                board[combo[2]],
            ) {
                if a == b && b == c {
                    return Some(a);
                }
            }
        }
        
        None
    }
    
    /// Update player statistics after game ends
    async fn update_game_result(&mut self, winner_addr: &str, loser_addr: &str, has_winner: bool, is_draw: bool) {
        if has_winner {
            // Update winner stats
            let mut winner_stats = self.state.get_or_create_player_stats(winner_addr.to_string()).await;
            winner_stats.games_won += 1;
            self.state.player_stats.insert(winner_addr, winner_stats).expect("Failed to update winner stats");
            
            // Update loser stats (only if not AI)
            if loser_addr != "AI" {
                let mut loser_stats = self.state.get_or_create_player_stats(loser_addr.to_string()).await;
                loser_stats.games_lost += 1;
                self.state.player_stats.insert(loser_addr, loser_stats).expect("Failed to update loser stats");
            }
        } else if is_draw {
            // Update both players for draw
            let mut stats_1 = self.state.get_or_create_player_stats(winner_addr.to_string()).await;
            stats_1.games_drawn += 1;
            self.state.player_stats.insert(winner_addr, stats_1).expect("Failed to update player 1 stats");
            
            if loser_addr != "AI" {
                let mut stats_2 = self.state.get_or_create_player_stats(loser_addr.to_string()).await;
                stats_2.games_drawn += 1;
                self.state.player_stats.insert(loser_addr, stats_2).expect("Failed to update player 2 stats");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use futures::FutureExt as _;
    use linera_sdk::{util::BlockingWait, views::View, Contract, ContractRuntime};
    use linera_sdk::linera_base_types::Timestamp;

    use tictactoe::{Operation, OperationResponse, GameResult};
    use super::{TicTacToeContract, TicTacToeState};

    #[test]
    fn create_game() {
        let mut app = create_and_instantiate_app();

        let response = app
            .execute_operation(Operation::CreateGame {
                player_x: "alice".to_string(),
                player_o: Some("bob".to_string()),
            })
            .blocking_wait();

        match response {
            OperationResponse::GameCreated(game_id) => {
                assert_eq!(game_id, 1);
            }
            _ => panic!("Expected GameCreated response"),
        }
    }

    #[test]
    fn make_move() {
        let mut app = create_and_instantiate_app();

        // Create game
        app.execute_operation(Operation::CreateGame {
            player_x: "alice".to_string(),
            player_o: Some("bob".to_string()),
        })
        .blocking_wait();

        // Make move
        let response = app
            .execute_operation(Operation::MakeMove {
                game_id: 1,
                player: "alice".to_string(),
                position: 0,
            })
            .blocking_wait();

        match response {
            OperationResponse::MoveMade => {
                // Success
            }
            _ => panic!("Expected MoveMade response"),
        }
    }

    fn create_and_instantiate_app() -> TicTacToeContract {
        let runtime = ContractRuntime::new()
            .with_application_parameters(())
            .with_system_time(Timestamp::from(0));
        let mut contract = TicTacToeContract {
            state: TicTacToeState::load(runtime.root_view_storage_context())
                .blocking_wait()
                .expect("Failed to read from mock key value store"),
            runtime,
        };

        contract
            .instantiate(())
            .now_or_never()
            .expect("Initialization should not await");

        contract
    }
}

