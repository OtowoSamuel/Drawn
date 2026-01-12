# Linot - Wave 5 Submission

Wave 5 transformed Linot into a fully playable multiplayer card game with polished frontend integration, real-time notifications, and automated deployment. All primary goals were achieved with enhanced user experience features.

## FRONTEND INTEGRATION WITH LIVE STATE UPDATES

Players access individual game interfaces at separate ports with real-time state synchronization polling every 500ms. The interface displays opponent hands, deck size, turn indicators, and card plays with instant updates. The system queries the authoritative PLAY_CHAIN for match state while accessing USER_CHAINs for player-specific hand data. Cross-chain messages follow Linera patterns with automatic subscription handling and proper timing for message propagation.

## REAL-TIME NOTIFICATION SYSTEM

Several pop-ups provide instant visual feedback for game events. Penalty notifications (Pick Two/Pick Three) show color-coded warnings to sender and receiver with real-time badge counts. Hold On notifications appear when turns are skipped. General Market notifications display when all opponents draw cards. Whot/Wild card interface includes suit selection modal with demand banners showing active suit requirements. Last card warnings alert players when opponents have one card remaining.

## SPECIAL CARD MECHANICS

All five special card types are fully operational. Value 2 (Pick Two) forces the next player to draw 2 cards, blockable by matching suit. Value 5 (Pick Three) forces 3-card draws except for Star suit which acts as a regular card. Value 1 (Hold On) skips the next player's turn. Value 14 (General Market) forces all opponents to draw. Value 20 (Whot/Wild) acts as a wild card with suit selection. Backend validation enforces Linot card game rules with proper suit checking and frontend validation allows cards matching suit or value.

## AUTOMATED DOCKER DEPLOYMENT

Single-command deployment via Docker Compose orchestrates the complete multiplayer environment from zero to playable game once build is complete. The system builds Rust contracts with wasm32 target and compiles the Next.js frontend. Deployment automation spawns a local Linera validator network, creates two player wallets with separate chains, publishes application bytecode, and auto-generates configuration files. GraphQL services run on separate ports for each player alongside isolated frontend servers. Players access game interfaces with zero manual configuration required.

## MULTI-CHAIN ARCHITECTURE

The system uses separate USER_CHAINs for player-specific data and a shared PLAY_CHAIN for authoritative game state. USER_CHAINs store nicknames and subscription status while PLAY_CHAIN manages match data, player hands, deck, discard pile, and turn order. Cross-chain messages operate through publish-subscribe with automatic event streaming and state updates.

## GAME LOGIC

Turn-based gameplay enforces strict validation with players acting only on their turn. Cards must match suit or value with special effects executing before turn advancement. Draw mechanics include manual draws and penalty draws with stack chaining for multiple penalty cards. Blocking penalties works by matching suit and redirecting to the next player. Win conditions trigger when a player empties their hand or has the fewest cards when the deck depletes.

## TECHNICAL CHALLENGES

- Docker memory requirements for Next.js builds necessitated 6-8GB RAM allocation to prevent build failures. 
- Cross-chain timing required strategic delays for message processing and network initialization to ensure state consistency. 
- Type mismatches between frontend strings and backend numeric values needed proper serialization. 
- GraphQL schema alignment required matching service resolvers with frontend queries.
- Event streaming reliability demanded robust subscription patterns to prevent duplicates.


-----
### TL:DR

The Docker-based environment supports two concurrent player nodes running on isolated chains for comprehensive multiplayer testing including match creation, game progression, special card interactions, and win conditions.

Wave 5 establishes Linot as a fully functional on-chain card game demonstrating Linera's capabilities for real-time multiplayer gaming with complex state management and cross-chain messaging. The single-command deployment removes blockchain complexity while maintaining decentralization benefits of running on Linera microchains.

