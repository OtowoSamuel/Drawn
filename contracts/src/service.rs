#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, linera_base_types::WithServiceAbi, views::View, Service,
    ServiceRuntime,
};

use drawn::Operation;
use self::state::DrawnState;

pub struct DrawnService {
    state: DrawnState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(DrawnService);

impl WithServiceAbi for DrawnService {
    type Abi = drawn::DrawnAbi;
}

impl Service for DrawnService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = DrawnState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        DrawnService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        let next_token_id = *self.state.next_token_id.get();
        let total_minted = *self.state.total_minted.get();
        
        Schema::build(
            QueryRoot {
                next_token_id,
                total_minted,
            },
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish()
        .execute(query)
        .await
    }
}

struct QueryRoot {
    next_token_id: u64,
    total_minted: u64,
}

#[Object]
impl QueryRoot {
    /// Get the next token ID that will be minted
    async fn next_token_id(&self) -> u64 {
        self.next_token_id
    }
    
    /// Get total number of stickers minted
    async fn total_minted(&self) -> u64 {
        self.total_minted
    }
}
