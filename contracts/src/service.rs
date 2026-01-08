#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::WithServiceAbi, views::View, Service,
    ServiceRuntime,
};

use tictactoe::{Operation, Game, PlayerStats};
use self::state::TicTacToeState;

pub struct TicTacToeService {
    state: Arc<TicTacToeState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(TicTacToeService);

impl WithServiceAbi for TicTacToeService {
    type Abi = tictactoe::TicTacToeAbi;
}

impl Service for TicTacToeService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = TicTacToeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        TicTacToeService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        let schema = Schema::build(
            QueryRoot {
                state: self.state.clone(),
            },
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish();
        
        schema.execute(query).await
    }
}

struct QueryRoot {
    state: Arc<TicTacToeState>,
}

#[Object]
impl QueryRoot {
    /// Get the next game ID that will be created
    async fn next_game_id(&self) -> u64 {
        *self.state.next_game_id.get()
    }
    
    /// Get total number of games created
    async fn total_games(&self) -> u64 {
        *self.state.total_games.get()
    }
    
    /// Get a specific game by ID
    async fn game(&self, game_id: u64) -> Option<Game> {
        self.state.get_game(game_id).await
    }
    
    /// Get player statistics
    async fn player_stats(&self, address: String) -> Option<PlayerStats> {
        self.state.get_player_stats(&address).await
    }
}
