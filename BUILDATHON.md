# Drawn - Linera Buildathon Submission

🎨 **Drawn** is an NFT sticker collection game built on Linera blockchain.

## Quick Start (Docker)

To run the complete application locally with Docker:

```bash
docker compose up --force-recreate
```

Wait for the healthcheck to pass (~30-60 seconds), then access:

- **Frontend**: http://localhost:5173
- **GraphiQL**: http://localhost:8080/chains/[CHAIN_ID]/applications/[APP_ID]
- **Faucet**: http://localhost:8080

The frontend will display the chain and application IDs automatically.

## What Does This Do?

The `docker compose up` command will:

1. ✅ Start a local Linera network with faucet
2. ✅ Initialize a wallet and request a chain
3. ✅ Build the Drawn smart contract (Rust → WASM)
4. ✅ Deploy the contract to the local network
5. ✅ Start the Linera node service (GraphQL API)
6. ✅ Start the Next.js frontend on port 5173

## Project Structure

```
Drawn/
├── contracts/          # Linera Rust smart contract
│   ├── src/
│   │   ├── lib.rs      # ABI and operations
│   │   ├── state.rs    # Application state
│   │   ├── contract.rs # Business logic
│   │   └── service.rs  # GraphQL service
│   ├── Cargo.toml
│   └── README.md       # Contract documentation
├── frontend/           # Next.js + Tailwind UI
│   ├── pages/
│   │   ├── _app.js
│   │   └── index.js    # Main page (contract dashboard)
│   └── package.json
├── backend/            # Express API (optional)
├── Dockerfile          # Container with Linera + Node.js
├── compose.yaml        # Docker Compose config
└── run.bash           # Deployment script
```

## Contract Features

The Drawn smart contract implements:

### Operations (Mutations)
- **MintSticker** - Create NFT stickers with metadata URIs
- **UpdateScore** - Track gameplay and allocate rewards
- **AllocateReward** - Distribute rewards to players
- **ClaimRewards** - Claim pending rewards

### Queries
- **totalMinted** - Total stickers minted
- **nextTokenId** - Next token ID

### State
- NFT collection (token → sticker metadata)
- Player data (address → scores, stickers, rewards)
- Auto-incrementing token IDs

## Try It Out

Once the container is running, try these operations in GraphiQL:

### Check Stats
```graphql
query {
  totalMinted
  nextTokenId
}
```

### Mint a Sticker
```graphql
mutation {
  mintSticker(
    owner: "alice"
    metadataUri: "ipfs://QmTest123"
    stickerType: "rare"
  )
}
```

### Update Score
```graphql
mutation {
  updateScore(tokenId: 1, score: 100)
}
```

### Allocate Rewards
```graphql
mutation {
  allocateReward(player: "alice", amount: 50)
}
```

See `contracts/EXAMPLES.md` for more examples.

## Technical Stack

- **Blockchain**: Linera (Rust smart contracts)
- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Node.js + Express (API layer)
- **Container**: Docker + Docker Compose
- **Tools**: Linera SDK 0.15.5, Rust 1.86, Node.js LTS

## Development

### Local Development (without Docker)

**Prerequisites:**
- Rust 1.86+
- Node.js 18+
- Linera CLI

**Contract:**
```bash
cd contracts
cargo test
cargo build --release --target wasm32-unknown-unknown
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Testing

**Contract tests:**
```bash
cd contracts
cargo test
```

**Manual testing:**
1. Start local network: `linera net up --with-faucet`
2. Deploy contract: `linera publish-and-create ...`
3. Start service: `linera service --port 8080`
4. Test in GraphiQL

## Port Structure

| Port | Service |
|------|---------|
| 5173 | Frontend (Next.js) |
| 8080 | Linera faucet + node service |
| 9001 | Localnet validator proxy |
| 13001 | Localnet validator |

## Healthcheck

The container healthcheck waits for the frontend to be available on `localhost:5173`. You can monitor the startup with:

```bash
docker compose logs -f
```

## Troubleshooting

### Container fails to start
```bash
docker compose down -v
docker compose up --force-recreate --build
```

### Port conflicts
If ports are in use, modify `compose.yaml`:
```yaml
ports:
  - "5174:5173"  # Change external port
```

### Frontend not loading
Check logs for the contract deployment:
```bash
docker compose logs app | grep "Drawn"
```

### View container logs
```bash
docker compose logs -f app
```

## Documentation

- `contracts/README.md` - Contract build/deploy instructions
- `contracts/EXAMPLES.md` - GraphQL query examples
- `DEPLOYMENT.md` - Testnet deployment guide

## Team

Built by the Drawn team for the Linera Buildathon.

## License

See LICENSE file.
