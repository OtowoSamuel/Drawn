#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::{AccountOwner, ChainId, WithContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
};

use tictactoe::{GameResult, Message, Operation};

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
    type Message = Message;
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
        // No initial setup needed
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::Start { players } => self.execute_start(players).await,
            Operation::MakeMove { position } => self.execute_make_move(position),
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::Start { players } => {
                // Initialize game on this temporary chain
                self.state.players.set(Some(players));
                self.state.board.set(tictactoe::Board::new());
            }
            Message::End { winner: _, players } => {
                // Remove this game chain from tracking on main chain
                let origin_chain = self.runtime.message_origin_chain_id().unwrap();
                for player in &players {
                    let chain_set = self
                        .state
                        .game_chains
                        .get_mut_or_default(player)
                        .await
                        .unwrap();
                    chain_set.retain(|game_chain| game_chain.chain_id != origin_chain);
                    if chain_set.is_empty() {
                        self.state.game_chains.remove(player).unwrap();
                    }
                }
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl TicTacToeContract {
    /// Start a new game directly on this chain (simplified single-chain demo)
    async fn execute_start(&mut self, players: [AccountOwner; 2]) -> GameResult {
        // Initialize game directly on this chain
        self.state.players.set(Some(players));
        self.state.board.set(tictactoe::Board::new());
        
        GameResult::Continue
    }

    /// Make a move in the game (simplified single-chain demo)
    fn execute_make_move(&mut self, position: u8) -> GameResult {
        // Just make the move - no authentication for demo
        let result = self.state.board.get_mut().make_move(position);
        result
    }

    /// Returns the main chain ID (where the application was created)
    #[allow(dead_code)]
    fn main_chain_id(&mut self) -> ChainId {
        self.runtime.application_creator_chain_id()
    }
}
