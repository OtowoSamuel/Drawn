# Drawn - Frontend

The frontend for Drawn, a multiplayer drawing and NFT sticker game built on Linera blockchain.

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React 18** - UI framework with TypeScript
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and state management

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or bun)
- Backend server running on port 3001
- Linera node running on port 8080 (for GraphQL)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:8080

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   ├── Layout.tsx    # Main layout wrapper
│   ├── Navbar.tsx    # Navigation bar
│   └── TicTacToe.tsx # Game component
├── pages/            # Route pages
│   ├── Landing.tsx
│   ├── Dashboard.tsx
│   ├── Game.tsx
│   ├── Lobby.tsx
│   ├── Leaderboard.tsx
│   ├── CreateNFT.tsx
│   ├── CreateProfile.tsx
│   ├── MatchResult.tsx
│   └── Rewards.tsx
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── App.tsx           # Main app component with routing
└── main.tsx          # App entry point
```

## Integration with Backend

The frontend communicates with:

1. **Express Backend** (port 3001)

   - REST API for metadata and game state
   - Example: `GET /api/metadata/:tokenId`

2. **Linera Blockchain** (port 8080)
   - GraphQL API for smart contract interactions
   - Mutations: `mintSticker`, `updateScore`, `allocateReward`
   - Queries: `totalMinted`, `nextTokenId`

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
VITE_CHAIN_ID=your_chain_id_here
```

## Development

```bash
# Run linter
npm run lint

# Build for development (includes source maps)
npm run build:dev
```
