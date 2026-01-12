use async_graphql::{Enum, Request, Response, SimpleObject};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct TicTacToeAbi;

impl ContractAbi for TicTacToeAbi {
    type Operation = Operation;
    type Response = GameResult;
}

impl ServiceAbi for TicTacToeAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Operations that can be performed
#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
#[serde(rename_all = "camelCase")]
pub enum Operation {
    /// Start a new game on a temporary chain  
    /// Creates a new temporary game chain and initializes it
    Start {
        /// The account owners of the two players [Player X, Player O]
        players: [AccountOwner; 2],
    },

    /// Make a move (must be called on a game chain)
    MakeMove {
        /// Position on the board (0-8)
        position: u8,
    },
}

/// Cross-chain messages for coordinating game state
#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    /// Sent to new temporary chain to initialize the game
    Start {
        players: [AccountOwner; 2],
    },

    /// Sent from game chain back to main chain when game ends
    End {
        winner: Option<AccountOwner>,
        players: [AccountOwner; 2],
    },
}

/// Player identifier
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Enum)]
pub enum Player {
    #[default]
    X,
    O,
}

impl Player {
    /// Returns the opponent of this player
    pub fn other(self) -> Self {
        match self {
            Player::X => Player::O,
            Player::O => Player::X,
        }
    }

    /// Returns 0 for X, 1 for O (for indexing into arrays)
    pub fn index(&self) -> usize {
        match self {
            Player::X => 0,
            Player::O => 1,
        }
    }
}

/// State of a cell on the board
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Enum)]
pub enum Cell {
    Empty,
    X,
    O,
}

impl Default for Cell {
    fn default() -> Self {
        Cell::Empty
    }
}

/// Game outcome/result
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum GameResult {
    /// A player won the game
    Winner(Player),
    /// Game ended in a draw
    Draw,
    /// Game is still ongoing
    Continue,
}

/// The Tic-Tac-Toe game board
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct Board {
    /// The 9 cells of the board (row-major order)
    pub cells: Vec<Cell>,
    /// Number of moves made so far
    pub moves_count: u8,
    /// Whether the game has finished (win or draw)
    pub finished: bool,
}

impl Board {
    /// Creates a new empty board
    pub fn new() -> Self {
        Board {
            cells: vec![Cell::Empty; 9],
            moves_count: 0,
            finished: false,
        }
    }

    /// Returns which player's turn it is
    /// X goes first, then they alternate
    pub fn active_player(&self) -> Player {
        if self.moves_count % 2 == 0 {
            Player::X
        } else {
            Player::O
        }
    }

    /// Makes a move at the specified position
    /// Returns the game result after the move
    pub fn make_move(&mut self, position: u8) -> GameResult {
        assert!(!self.finished, "Game is already over");
        assert!(position < 9, "Position must be 0-8");
        assert_eq!(
            self.cells[position as usize],
            Cell::Empty,
            "Cell must be empty"
        );

        let player = self.active_player();
        self.cells[position as usize] = match player {
            Player::X => Cell::X,
            Player::O => Cell::O,
        };
        self.moves_count += 1;

        let result = self.check_winner();
        
        // Mark game as finished if it ended
        if result != GameResult::Continue {
            self.finished = true;
        }
        
        result
    }

    /// Checks if there's a winner or if the game is a draw
    fn check_winner(&self) -> GameResult {
        const WINNING_LINES: [[usize; 3]; 8] = [
            [0, 1, 2], // Top row
            [3, 4, 5], // Middle row
            [6, 7, 8], // Bottom row
            [0, 3, 6], // Left column
            [1, 4, 7], // Middle column
            [2, 5, 8], // Right column
            [0, 4, 8], // Diagonal \
            [2, 4, 6], // Diagonal /
        ];

        for [a, b, c] in WINNING_LINES {
            if self.cells[a] != Cell::Empty
                && self.cells[a] == self.cells[b]
                && self.cells[a] == self.cells[c]
            {
                return GameResult::Winner(if self.cells[a] == Cell::X {
                    Player::X
                } else {
                    Player::O
                });
            }
        }

        // Check for draw (all cells filled, no winner)
        if self.moves_count == 9 {
            GameResult::Draw
        } else {
            GameResult::Continue
        }
    }
}

impl Default for Board {
    fn default() -> Self {
        Self::new()
    }
}
