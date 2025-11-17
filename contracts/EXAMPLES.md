# Drawn Contract - Example GraphQL Queries & Mutations

This file contains example GraphQL queries and mutations for interacting with the Drawn NFT sticker game contract.

## Access GraphiQL Interface

After deploying and starting the node service:

```bash
linera service --port 8080
```

Navigate to:
```
http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>
```

## Queries

### Get Total Minted Stickers

```graphql
query {
  totalMinted
  nextTokenId
}
```

Expected response:
```json
{
  "data": {
    "totalMinted": 5,
    "nextTokenId": 6
  }
}
```

## Mutations

### Mint a New Sticker

```graphql
mutation {
  mintSticker(
    owner: "alice"
    metadataUri: "ipfs://QmXxxxYourIPFSHashHere"
    stickerType: "rare"
  )
}
```

Response returns the token ID of the newly minted sticker.

### Mint Multiple Stickers (Different Types)

Common sticker:
```graphql
mutation {
  mintSticker(
    owner: "bob"
    metadataUri: "ipfs://QmCommonSticker123"
    stickerType: "common"
  )
}
```

Epic sticker:
```graphql
mutation {
  mintSticker(
    owner: "charlie"
    metadataUri: "ipfs://QmEpicSticker456"
    stickerType: "epic"
  )
}
```

Legendary sticker:
```graphql
mutation {
  mintSticker(
    owner: "diana"
    metadataUri: "ipfs://QmLegendarySticker789"
    stickerType: "legendary"
  )
}
```

### Update Player Score

```graphql
mutation {
  updateScore(tokenId: 1, score: 100)
}
```

This operation:
- Adds 100 to the player's total score
- Allocates 100 reward points (1:1 ratio with score)

### Allocate Rewards Manually

```graphql
mutation {
  allocateReward(player: "alice", amount: 500)
}
```

This is an admin operation to manually allocate rewards to a player.

### Claim Rewards

```graphql
mutation {
  claimRewards
}
```

Note: The current implementation needs enhancement to properly identify the caller. In production, this would verify the authenticated user's address and transfer their pending rewards.

## Example Game Flow

### 1. New Player Joins

```graphql
# Mint their first sticker
mutation {
  mintSticker(
    owner: "newplayer"
    metadataUri: "ipfs://QmStarterPack001"
    stickerType: "starter"
  )
}
```

### 2. Player Completes a Challenge

```graphql
# Award score for completion
mutation {
  updateScore(tokenId: 1, score: 250)
}
```

### 3. Player Earns a Rare Drop

```graphql
# Mint a rare sticker as reward
mutation {
  mintSticker(
    owner: "newplayer"
    metadataUri: "ipfs://QmRareDrop999"
    stickerType: "rare"
  )
}
```

### 4. Check Game Stats

```graphql
query {
  totalMinted
  nextTokenId
}
```

## Integration with Frontend

Your frontend application should:

1. **Connect wallet** using Linear/Linera Wallet SDK
2. **Execute mutations** by signing transactions with the connected wallet
3. **Poll queries** to update the UI with current game state

Example JavaScript (pseudo-code):

```javascript
// Connect wallet
const wallet = await lineraWallet.connect();

// Mint sticker (transaction)
const tx = await wallet.executeMutation(`
  mutation {
    mintSticker(
      owner: "${wallet.address}"
      metadataUri: "ipfs://QmYourHash"
      stickerType: "rare"
    )
  }
`);

// Query game state (read-only)
const stats = await fetch(graphqlEndpoint, {
  method: 'POST',
  body: JSON.stringify({
    query: `{ totalMinted nextTokenId }`
  })
});
```

## IPFS Metadata Structure

When uploading sticker assets to IPFS/Pinata, use this JSON structure:

```json
{
  "name": "Drawn Sticker #1",
  "description": "A rare collectible sticker from the Drawn game",
  "image": "ipfs://QmImageHash123",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Rare"
    },
    {
      "trait_type": "Collection",
      "value": "Genesis"
    },
    {
      "trait_type": "Artist",
      "value": "Drawn Team"
    }
  ]
}
```

Upload this JSON to IPFS and use the resulting hash as the `metadataUri` in the mint operation.

## Tips for Production

1. **Batch Operations**: Consider adding batch mint operations if you need to distribute multiple stickers at once
2. **Events**: Add event emission so external services can track mints, score updates, and reward claims
3. **Access Control**: Implement proper admin roles for operations like `allocateReward`
4. **Caller Authentication**: Enhance `claimRewards` to properly identify and verify the caller
5. **Query Enhancement**: Add queries to fetch sticker details and player data (requires state access pattern changes in the service layer)
