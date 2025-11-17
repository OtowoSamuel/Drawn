#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use drawn::{Operation, OperationResponse, Sticker};
use self::state::DrawnState;

pub struct DrawnContract {
    state: DrawnState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(DrawnContract);

impl WithContractAbi for DrawnContract {
    type Abi = drawn::DrawnAbi;
}

impl Contract for DrawnContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = (); // No initial argument needed
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = DrawnState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        DrawnContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        self.runtime.application_parameters();
        // Initialize with token ID starting at 1
        self.state.next_token_id.set(1);
        self.state.total_minted.set(0);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::MintSticker {
                owner,
                metadata_uri,
                sticker_type,
            } => {
                // Get next token ID
                let token_id = *self.state.next_token_id.get();
                
                // Create sticker
                let sticker = Sticker {
                    token_id,
                    owner: owner.clone(),
                    metadata_uri,
                    sticker_type,
                    minted_at: self.runtime.system_time().micros(),
                };
                
                // Store sticker
                self.state.stickers.insert(&token_id, sticker).expect("Failed to insert sticker");
                
                // Update player data
                let mut player = self.state.get_or_create_player(owner).await;
                player.stickers_owned.push(token_id);
                let player_address = player.address.clone();
                self.state.players.insert(&player_address, player).expect("Failed to update player");
                
                // Increment counters
                self.state.next_token_id.set(token_id + 1);
                let total = *self.state.total_minted.get();
                self.state.total_minted.set(total + 1);
                
                OperationResponse::Minted(token_id)
            }
            
            Operation::UpdateScore { token_id, score } => {
                // Get sticker to find owner
                let sticker = self.state.get_sticker(token_id).await
                    .expect("Sticker not found");
                
                // Update player score
                let mut player = self.state.get_or_create_player(sticker.owner.clone()).await;
                player.total_score += score;
                
                // Award rewards based on score (simple 1:1 ratio)
                player.pending_rewards += score;
                
                let player_address = player.address.clone();
                self.state.players.insert(&player_address, player).expect("Failed to update player");
                
                OperationResponse::ScoreUpdated
            }
            
            Operation::AllocateReward { player, amount } => {
                let mut player_data = self.state.get_or_create_player(player).await;
                player_data.pending_rewards += amount;
                let player_address = player_data.address.clone();
                self.state.players.insert(&player_address, player_data).expect("Failed to update player");
                
                OperationResponse::RewardAllocated
            }
            
            Operation::ClaimRewards => {
                // Get caller (in production, use authenticated caller)
                // For now, we'll need the caller to be passed or use a different pattern
                // This is a simplified version - in production you'd verify the caller
                
                // Placeholder: return 0 for now
                // In a real implementation, you'd need to track the caller's address
                OperationResponse::RewardClaimed(0)
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

#[cfg(test)]
mod tests {
    use futures::FutureExt as _;
    use linera_sdk::{util::BlockingWait, views::View, Contract, ContractRuntime};
    use linera_sdk::linera_base_types::Timestamp;

    use drawn::{Operation, OperationResponse};
    use super::{DrawnContract, DrawnState};

    #[test]
    fn mint_sticker() {
        let mut app = create_and_instantiate_app();

        let response = app
            .execute_operation(Operation::MintSticker {
                owner: "alice".to_string(),
                metadata_uri: "ipfs://QmTest123".to_string(),
                sticker_type: "rare".to_string(),
            })
            .blocking_wait();

        match response {
            OperationResponse::Minted(token_id) => {
                assert_eq!(token_id, 1);
            }
            _ => panic!("Expected Minted response"),
        }
    }

    #[test]
    fn update_score() {
        let mut app = create_and_instantiate_app();

        // First mint a sticker
        app.execute_operation(Operation::MintSticker {
            owner: "alice".to_string(),
            metadata_uri: "ipfs://QmTest123".to_string(),
            sticker_type: "rare".to_string(),
        })
        .blocking_wait();

        // Then update score
        let response = app
            .execute_operation(Operation::UpdateScore {
                token_id: 1,
                score: 100,
            })
            .blocking_wait();

        match response {
            OperationResponse::ScoreUpdated => {
                // Success
            }
            _ => panic!("Expected ScoreUpdated response"),
        }
    }

    fn create_and_instantiate_app() -> DrawnContract {
        let runtime = ContractRuntime::new()
            .with_application_parameters(())
            .with_system_time(Timestamp::from(0)); // Mock system time for testing
        let mut contract = DrawnContract {
            state: DrawnState::load(runtime.root_view_storage_context())
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
