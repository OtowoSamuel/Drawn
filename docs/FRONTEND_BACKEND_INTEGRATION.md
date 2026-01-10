# Frontend-Backend Integration Guide

This document explains how the frontend and backend communicate in the Drawn dApp architecture.

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │   HTTP   │                 │ GraphQL │                 │
│    Frontend     │ ◄──────► │  Express API    │ ◄──────►│  Linera Node    │
│  (React/Vite)   │  REST    │  (Port 3001)    │         │  (Port 8080)    │
│                 │          │                 │         │                 │
└─────────────────┘          └─────────────────┘         └─────────────────┘
      │                             │                            │
      │                             │                            │
      └─────────────────────────────┴────────────────────────────┘
                          Direct GraphQL (Optional)
```

## Communication Layers

### 1. Frontend → Backend (REST API)

**Purpose**: Handle application logic, user data, and prepare data for blockchain

**Backend Endpoints** (Current):

```javascript
// Health check
GET /health
Response: { status: 'ok' }

// Get NFT metadata
GET /api/metadata/:tokenId
Response: {
  name: string,
  description: string,
  image: string (IPFS URL)
}
```

**Backend Endpoints** (To Implement):

```javascript
// User profile management
POST /api/profile/create
Body: { username, walletAddress }
Response: { userId, username, createdAt }

GET /api/profile/:walletAddress
Response: { userId, username, stats, createdAt }

// Game session management
POST /api/game/create
Body: { hostWallet, gameType, maxPlayers }
Response: { gameId, hostWallet, status }

GET /api/game/:gameId
Response: { gameId, players[], status, startedAt }

POST /api/game/:gameId/join
Body: { playerWallet }
Response: { success, playerIndex }

// IPFS/Pinata integration
POST /api/nft/upload-image
Body: FormData with image file
Response: { ipfsHash, url }

POST /api/nft/metadata
Body: { name, description, imageHash, attributes }
Response: { metadataHash, url }
```

### 2. Backend → Linera Blockchain (GraphQL)

**Purpose**: Execute smart contract operations and query blockchain state

**GraphQL Endpoint**: `http://localhost:8080/graphql`

**Mutations** (Write Operations):

```graphql
mutation MintSticker {
  mintSticker(
    owner: "wallet_address"
    tokenUri: "ipfs://..."
    stickerType: "Win"
  ) {
    tokenId
    owner
    tokenUri
  }
}

mutation UpdateScore {
  updateScore(tokenId: 1, newScore: 100) {
    success
    tokenId
    score
  }
}

mutation AllocateReward {
  allocateReward(player: "wallet_address", amount: 10) {
    success
    totalAllocated
  }
}

mutation ClaimRewards {
  claimRewards {
    success
    amount
  }
}
```

**Queries** (Read Operations):

```graphql
query GetStats {
  totalMinted
  nextTokenId
}

query GetPlayerData {
  player(address: "wallet_address") {
    totalScore
    pendingRewards
    stickerIds
  }
}
```

### 3. Frontend → Linera (Direct GraphQL - Optional)

For read-only queries, the frontend can directly query the Linera node:

```typescript
// Frontend code example
const GRAPHQL_ENDPOINT = import.meta.env.VITE_LINERA_GRAPHQL_URL;

async function getTotalMinted() {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query { totalMinted }`,
    }),
  });

  const data = await response.json();
  return data.data.totalMinted;
}
```

## Data Flow Examples

### Example 1: Minting an NFT Sticker

```
1. User draws/uploads image → Frontend
2. Frontend → POST /api/nft/upload-image → Backend
3. Backend → Upload to Pinata → Get IPFS hash
4. Backend → Create metadata JSON → Upload to Pinata
5. Backend → GraphQL mintSticker mutation → Linera
6. Linera → Execute contract → Return tokenId
7. Backend → Return tokenId + metadata → Frontend
8. Frontend → Display success + NFT details
```

### Example 2: Viewing Game Stats

```
1. User opens Dashboard → Frontend
2. Frontend → GET /api/profile/:walletAddress → Backend
3. Backend → Return cached profile data → Frontend
4. Frontend → GraphQL query totalMinted → Linera (direct)
5. Linera → Return blockchain stats → Frontend
6. Frontend → Render dashboard with combined data
```

### Example 3: Playing a Game

```
1. User creates game → Frontend
2. Frontend → POST /api/game/create → Backend
3. Backend → Store game session in DB → Return gameId
4. Other players join → POST /api/game/:gameId/join
5. Game starts → Frontend handles game logic locally
6. Game ends → Frontend calculates winner
7. Frontend → POST /api/game/:gameId/finish → Backend
8. Backend → GraphQL allocateReward → Linera
9. Backend → GraphQL mintSticker (if conditions met) → Linera
10. Frontend → Show match results + rewards
```

## Backend Implementation Checklist

### Phase 1: Core API (Current)

- [x] Health check endpoint
- [x] Basic metadata endpoint
- [ ] CORS configuration for frontend
- [ ] Error handling middleware

### Phase 2: Database Integration

- [ ] Choose database (Supabase/Firebase/PostgreSQL)
- [ ] User profile schema
- [ ] Game session schema
- [ ] Set up environment variables

### Phase 3: IPFS Integration

- [ ] Pinata API key setup
- [ ] Image upload endpoint
- [ ] Metadata upload endpoint
- [ ] PIN management

### Phase 4: Blockchain Integration

- [ ] GraphQL client setup for Linera
- [ ] Wallet integration for signing
- [ ] Transaction relayer logic
- [ ] Error handling for blockchain calls

### Phase 5: Game Logic

- [ ] Game session endpoints
- [ ] Player matching logic
- [ ] Score calculation
- [ ] Reward distribution logic

## Environment Variables

### Frontend (.env)

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
VITE_CHAIN_ID=your_chain_id
```

### Backend (.env)

```env
PORT=3001
NODE_ENV=development

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key

# IPFS
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key

# Blockchain
LINERA_GRAPHQL_URL=http://localhost:8080/graphql
LINERA_CHAIN_ID=your_chain_id
LINERA_PRIVATE_KEY=your_private_key
```

## Security Considerations

1. **Never expose private keys** in frontend
2. **Validate all inputs** on backend before blockchain calls
3. **Rate limit** API endpoints to prevent abuse
4. **Use CORS** properly to restrict frontend origins
5. **Sanitize file uploads** before sending to IPFS
6. **Sign transactions** on backend when acting as relayer
7. **Verify wallet ownership** for profile operations

## Next Steps

1. **Remove Lovable references** ✅ (Completed)
2. **Set up database** (Supabase recommended)
3. **Implement IPFS integration** (Pinata)
4. **Create backend services** for game logic
5. **Build GraphQL client** in backend
6. **Update frontend** to use new API endpoints
7. **Add wallet integration** (Linera SDK)
8. **Test end-to-end flows**

## Testing Strategy

### Backend Tests

```bash
cd backend
npm test
```

Test files to create:

- `tests/api.test.js` - REST endpoint tests
- `tests/ipfs.test.js` - IPFS upload tests
- `tests/blockchain.test.js` - GraphQL integration tests

### Frontend Tests

- Component tests with React Testing Library
- Integration tests for API calls
- E2E tests with Playwright/Cypress

## Useful Resources

- [Linera Documentation](https://linera.dev/docs)
- [Pinata IPFS API](https://docs.pinata.cloud/)
- [Supabase Quick Start](https://supabase.com/docs)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
