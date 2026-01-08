use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct TicTacToeAbi;

impl ContractAbi for TicTacToeAbi {
    type Operation = Operation;
    type Response = OperationResponse;
}

impl ServiceAbi for TicTacToeAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Response types for operations
#[derive(Debug, Serialize, Deserialize)]
pub enum OperationResponse {
    /// Game created successfully with game ID
    GameCreated(u64),
    /// Move made successfully
    MoveMade,
    /// Game ended with winner or draw
    GameEnded(GameResult),
}

/// Result of a completed game
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameResult {
    Winner(String), // Player address who won
    Draw,
}

/// Operations that can be performed on the Tic-Tac-Toe contract
#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Create a new game (either single player vs AI or two player)
    CreateGame {
        player_x: String,
        player_o: Option<String>, // None for single player vs AI
    },
    
    /// Make a move in an existing game
    MakeMove {
        game_id: u64,
        player: String,
        position: u8, // 0-8 representing board positions
    },
}

/// Player symbol in the game
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, async_graphql::Enum)]
pub enum PlayerSymbol {
    X,
    O,
}

/// Game status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, async_graphql::Enum)]
pub enum GameStatus {
    Active,
    XWins,
    OWins,
    Draw,
}

/// Represents a Tic-Tac-Toe game
#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct Game {
    pub game_id: u64,
    pub player_x: String,
    pub player_o: String, // "AI" for single player mode
    pub board: Vec<Option<PlayerSymbol>>, // 9 positions
    pub current_turn: PlayerSymbol,
    pub status: GameStatus,
    pub created_at: u64, // timestamp
    pub winner: Option<String>,
}

/// Player statistics
#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct PlayerStats {
    pub address: String,
    pub games_played: u64,
    pub games_won: u64,
    pub games_lost: u64,
    pub games_drawn: u64,
}

