use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};
use drawn::{Sticker, PlayerData};

/// The application state for Drawn NFT game
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct DrawnState {
    /// Counter for next token ID
    pub next_token_id: RegisterView<u64>,
    
    /// Mapping of token_id -> Sticker
    pub stickers: MapView<u64, Sticker>,
    
    /// Mapping of player address -> PlayerData
    pub players: MapView<String, PlayerData>,
    
    /// Total stickers minted
    pub total_minted: RegisterView<u64>,
}

impl DrawnState {
    /// Get a sticker by token ID
    pub async fn get_sticker(&self, token_id: u64) -> Option<Sticker> {
        self.stickers.get(&token_id).await.ok().flatten()
    }
    
    /// Get player data by address
    pub async fn get_player(&self, address: &str) -> Option<PlayerData> {
        self.players.get(address).await.ok().flatten()
    }
    
    /// Get or create player data
    pub async fn get_or_create_player(&mut self, address: String) -> PlayerData {
        match self.players.get(&address).await.ok().flatten() {
            Some(player) => player,
            None => PlayerData {
                address: address.clone(),
                total_score: 0,
                stickers_owned: vec![],
                pending_rewards: 0,
            }
        }
    }
}
