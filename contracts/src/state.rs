use async_graphql::SimpleObject;
use linera_sdk::{
    linera_base_types::{AccountOwner, ChainId},
    views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use tictactoe::Board;

/// Identifier for a temporary game chain
#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize, SimpleObject)]
pub struct GameChain {
    /// The ID of the temporary game chain
    pub chain_id: ChainId,
}

/// The application state for Tic-Tac-Toe
#[derive(RootView, SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct TicTacToeState {
    /// The players on this chain (only set on game chains, None on main chain)
    pub players: RegisterView<Option<[AccountOwner; 2]>>,

    /// The current game board (only on game chains)
    pub board: RegisterView<Board>,

    /// Active game chains tracked on main chain
    /// Maps each player to the set of games they're participating in
    pub game_chains: MapView<AccountOwner, BTreeSet<GameChain>>,
}
