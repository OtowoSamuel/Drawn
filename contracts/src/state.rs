use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};
use tictactoe::{Game, PlayerStats};

/// The application state for Tic-Tac-Toe game
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct TicTacToeState {
    /// Counter for next game ID
    pub next_game_id: RegisterView<u64>,
    
    /// Mapping of game_id -> Game
    pub games: MapView<u64, Game>,
    
    /// Mapping of player address -> PlayerStats
    pub player_stats: MapView<String, PlayerStats>,
    
    /// Total games created
    pub total_games: RegisterView<u64>,
}

impl TicTacToeState {
    /// Get a game by ID
    pub async fn get_game(&self, game_id: u64) -> Option<Game> {
        self.games.get(&game_id).await.ok().flatten()
    }
    
    /// Get player statistics
    pub async fn get_player_stats(&self, address: &str) -> Option<PlayerStats> {
        self.player_stats.get(address).await.ok().flatten()
    }
    
    /// Get or create player statistics
    pub async fn get_or_create_player_stats(&mut self, address: String) -> PlayerStats {
        match self.player_stats.get(&address).await.ok().flatten() {
            Some(stats) => stats,
            None => PlayerStats {
                address: address.clone(),
                games_played: 0,
                games_won: 0,
                games_lost: 0,
                games_drawn: 0,
            }
        }
    }
}

