use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct DrawnAbi;

impl ContractAbi for DrawnAbi {
    type Operation = Operation;
    type Response = OperationResponse;
}

impl ServiceAbi for DrawnAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Response types for operations
#[derive(Debug, Serialize, Deserialize)]
pub enum OperationResponse {
    /// NFT minted successfully with token ID
    Minted(u64),
    /// Gameplay score updated
    ScoreUpdated,
    /// Reward allocated
    RewardAllocated,
    /// Reward claimed
    RewardClaimed(u64),
}

/// Operations that can be performed on the Drawn contract
#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Mint a new sticker NFT to an owner with metadata URI
    MintSticker {
        owner: String,
        metadata_uri: String,
        sticker_type: String,
    },
    
    /// Update gameplay score for a token
    UpdateScore {
        token_id: u64,
        score: u64,
    },
    
    /// Allocate rewards to a player
    AllocateReward {
        player: String,
        amount: u64,
    },
    
    /// Claim pending rewards
    ClaimRewards,
}

/// Represents a sticker NFT
#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct Sticker {
    pub token_id: u64,
    pub owner: String,
    pub metadata_uri: String,
    pub sticker_type: String,
    pub minted_at: u64, // timestamp
}

/// Player gameplay data
#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct PlayerData {
    pub address: String,
    pub total_score: u64,
    pub stickers_owned: Vec<u64>,
    pub pending_rewards: u64,
}
