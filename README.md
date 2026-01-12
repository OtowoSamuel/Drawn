# Drawn - Blockchain Tic-Tac-Toe

**Wave 5 Submission: Single-Player Demo**

A fully functional blockchain-based Tic-Tac-Toe game built on Linera. This Wave 5 submission demonstrates core blockchain integration with a working single-player mode.

##  What We Built

✅ **Working Features (Wave 5):**
- Complete Linera smart contract implementation (Rust)
- React frontend with real-time GraphQL polling
- Single-player gameplay (control both X and O)
- Blockchain state persistence
- Docker deployment ready
- Winner status determined immediately game is over

##  Quick Start

### Option 1: Docker (Recommended for Judges)

```bash
docker compose up --build
```

Then visit: **http://localhost:5173**

### Option 2: Local Development

```bash
./run.bash
```

Then visit: **http://localhost:5173**

---

##  How to Play

1. Click **"Play Tic-Tac-Toe"**
2. Click any cell to place X
3. Click another cell to place O
4. Continue alternating until someone wins or draws
5. Click **"Play Again"** to start a new game

**Note:** This is a single-player demo where you control both players. Further integration and building is done for NFT creation, multiplayer gameplay and more

---

##  Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│                                     │
│  ┌─────────────┐  ┌──────────────┐ │
│  │  Linera     │  │  Frontend    │ │
│  │  Contracts  │  │  (React)     │ │
│  │  (Rust)     │  │  + Vite      │ │
│  │             │  │              │ │
│  │  Port 8081  │  │  Port 5173   │ │
│  │  GraphQL    │  │              │ │
│  └──────┬──────┘  └──────┬───────┘ │
│         │                 │         │
│    Blockchain State Sync (1s poll) │
└─────────────────────────────────────┘
```

**Tech Stack:**
- **Blockchain:** Linera (version 15.8)
- **Smart Contracts:** Rust (1.86)
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui

---

##  Project Structure

```
Drawn/
├── contracts/          # Rust smart contracts (BACKEND)
│   ├── src/
│   │   ├── contract.rs  # Game logic & operations
│   │   ├── service.rs   # GraphQL query service
│   │   ├── state.rs     # Blockchain state
│   │   └── lib.rs       # Types & game rules
├── frontend/           # React frontend
│   ├── src/
│   │   ├── pages/       # Game page
│   │   ├── components/  # TicTacToe board
│   │   └── lib/         # GraphQL client
├── run.bash            # Startup script
├── Dockerfile          # Container definition
└── compose.yaml        # Docker Compose config
```


---

##  Current Implementation (Wave 5)

### Smart Contracts (`contracts/src/`)

**✅ Implemented:**
- `Operation::Start` - Initialize game with two players
- `Operation::MakeMove` - Submit move to blockchain
- Game state validation (bounds checking, turn logic)
- Winner detection (rows, columns, diagonals)
- Draw detection

**Contract Features:**
- State persists on blockchain
- Mutations return transaction hashes
- GraphQL queries for real-time state
- Board represented as 9-cell array

### Frontend (`frontend/src/`)

**✅ Implemented:**
- Single-page game interface
- Real-time state polling (1 second interval)
- Click-to-play interaction
- Win/draw detection UI
- Responsive design (mobile-ready)

**Integration:**
- GraphQL client for blockchain
- Environment-based configuration
- Auto-configured by `run.bash`

---

##  Future Development Plans

### Wave 6+ Roadmap

**Multiplayer Mode:**
- [ ] Lobby system for matchmaking
- [ ] Game invites via chain messaging
- [ ] Spectator mode
- [ ] Game history/replay

**Authentication:**
- [ ] Linera wallet integration (Once deployed onto testnet and mainnet)
- [ ] Player profiles on-chain
- [ ] Username registration

**Competitive Features:**
- [ ] Leaderboard (ELO rating)
- [ ] Tournament brackets
- [ ] Ranked matches
- [ ] Seasonal rewards

**Enhanced Gameplay:**
- [ ] Multiple board sizes (4x4, 5x5)
- [ ] Game variants (3D tic-tac-toe)
- [ ] Custom themes and skins
- [ ] Animated moves

**NFT Integration:**
- [ ] NFT profile pictures
- [ ] Collectible board skins
- [ ] Achievement badges

**Analytics:**
- [ ] Move history tracking
- [ ] Win rate statistics
- [ ] Popular opening moves
- [ ] Player insights

---

##  Development

### Prerequisites

- Rust (latest stable)
- Node.js LTS
- Docker (optional)
- Linera CLI 15.8

### Local Setup

1. **Clone the repository:**
```bash
git clone https://github.com/zaneal34/Drawn.git
cd Drawn
```

2. **Run the app:**
```bash
docker compose up --build
```

3. **Open browser:**
```
http://localhost:5173
```


---

## 👥 Team

| Name | Role | GitHub |
|------|------|--------|
| **Samuel Otowo** | Senior Lead Developer + Smart Contract | [OtowoSamuel](https://github.com/OtowoSamuel) |
| **Zaneal** | Lead Developer | [@zaneal343](https://github.com/zaneal343) |

---

## 📝 License - Open Source

MIT License - see [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

Built for the Linera Buildathon Wave 5

**Resources:**
- [Linera Documentation](https://linera.dev)
- Inspired by microchess and linot examples
- shadcn/ui for beautiful components

---

##  Try It Now!

```bash
docker compose up --build
# Visit http://localhost:5173/gamex
```

