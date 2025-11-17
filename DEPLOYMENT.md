# Drawn - Deployment Guide

This guide walks you through deploying the Drawn NFT sticker game to Linera testnet.

## Prerequisites

1. **Rust toolchain**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. **Linera CLI** - Follow the official Linera documentation for installation

## Step 1: Build the Contract

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

This creates two WASM files:
- `target/wasm32-unknown-unknown/release/drawn_contract.wasm`
- `target/wasm32-unknown-unknown/release/drawn_service.wasm`

## Step 2: Initialize Wallet and Request Chain

```bash
# Initialize wallet with testnet faucet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Request a new chain with tokens
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net

# Check your wallet
linera wallet show
```

## Step 3: Deploy the Application

```bash
cd contracts

# Deploy contract and service
linera publish-and-create \
  target/wasm32-unknown-unknown/release/drawn_{contract,service}.wasm
```

**Important**: This contract doesn't require initialization arguments, so no `--json-argument` flag is needed.

After deployment, you'll receive:
- **Chain ID**: A long hex string identifying your chain
- **Application ID**: A long hex string identifying your deployed application

Save these IDs - you'll need them to interact with your contract.

## Step 4: Start the Node Service

```bash
linera service --port 8080
```

If port 8080 is in use:
```bash
linera service --port 8081
```

## Step 5: Access GraphiQL Interface

Open your browser and navigate to:
```
http://localhost:8080/chains/<YOUR_CHAIN_ID>/applications/<YOUR_APP_ID>
```

Replace `<YOUR_CHAIN_ID>` and `<YOUR_APP_ID>` with the IDs from Step 3.

## Step 6: Test the Contract

Try these queries in GraphiQL:

### Check initial state
```graphql
query {
  totalMinted
  nextTokenId
}
```

### Mint a sticker
```graphql
mutation {
  mintSticker(
    owner: "alice"
    metadataUri: "ipfs://QmTest123"
    stickerType: "rare"
  )
}
```

### Check updated state
```graphql
query {
  totalMinted
  nextTokenId
}
```

### Update score
```graphql
mutation {
  updateScore(tokenId: 1, score: 100)
}
```

## Step 7: Deploy Frontend and Backend

### Backend (Express API)

```bash
cd backend
npm install
npm run dev
```

Update the backend to:
1. Connect to your deployed Linera contract
2. Handle metadata requests for the frontend
3. Optionally act as a relayer for transactions

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Update the frontend to:
1. Integrate Linear/Linera Wallet SDK
2. Connect to your GraphQL endpoint
3. Display stickers and game state
4. Allow users to mint stickers and play

## Common Issues & Solutions

### Issue: Port Already in Use

```
Error: Address already in use (os error 48)
```

**Solution**: Use a different port
```bash
linera service --port 8081
```

### Issue: Wallet Not Initialized

```
Error: Wallet not found
```

**Solution**: Initialize wallet first
```bash
linera wallet init --faucet https://faucet.testnet-conway.linera.net
```

### Issue: Insufficient Funds

**Solution**: Request tokens from faucet
```bash
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
```

### Issue: Build Fails

**Solution**: Ensure you have the WASM target
```bash
rustup target add wasm32-unknown-unknown
```

## Production Deployment Checklist

- [ ] Run full test suite: `cargo test`
- [ ] Build optimized WASM: `cargo build --release --target wasm32-unknown-unknown`
- [ ] Test locally with `linera service`
- [ ] Deploy to testnet and verify all operations
- [ ] Set up IPFS/Pinata for metadata storage
- [ ] Configure backend with environment variables
- [ ] Set up frontend with wallet integration
- [ ] Test end-to-end flow: connect wallet → mint → score → rewards
- [ ] Monitor contract performance and costs
- [ ] Plan for mainnet deployment

## Monitoring & Maintenance

### Check Chain Status
```bash
linera wallet show
linera sync
linera query-balance
```

### View Application Logs
The `linera service` command shows logs in the terminal. Monitor for:
- Transaction successes/failures
- GraphQL query performance
- State changes

### Update Contract
To deploy a new version:
1. Make changes to `src/` files
2. Rebuild: `cargo build --release --target wasm32-unknown-unknown`
3. Deploy again with `linera publish-and-create`

Note: Each deployment creates a new application instance. Plan for migration if you need to preserve state.

## Useful Commands Reference

```bash
# Build contract
cargo build --release --target wasm32-unknown-unknown

# Run tests
cargo test

# Initialize wallet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Request chain
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net

# Deploy
linera publish-and-create \
  target/wasm32-unknown-unknown/release/drawn_{contract,service}.wasm

# Start service
linera service --port 8080

# Check status
linera wallet show
linera sync
linera query-balance
```

## Next Steps

1. Customize the contract for your game mechanics
2. Add more operations (trade stickers, collections, achievements)
3. Implement events for better off-chain tracking
4. Build out the frontend with wallet integration
5. Set up IPFS for asset storage
6. Add analytics and monitoring
7. Plan for mainnet launch

For more examples, see `contracts/EXAMPLES.md`.
