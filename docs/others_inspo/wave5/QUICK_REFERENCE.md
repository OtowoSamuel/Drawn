# Drawn - Quick Reference Card

## 🎯 One-Line Summary
NFT sticker collection game on Linera with on-chain minting, scoring, and rewards.

## 🚀 Quick Start
```bash
docker compose up --force-recreate
# Wait 30-60s, then visit http://localhost:5173
```

## 🔗 Access Points
- **Frontend**: http://localhost:5173
- **GraphiQL**: Shown on frontend
- **Faucet**: http://localhost:8080

## 📊 Key Features
- ✅ Mint NFT stickers with IPFS metadata
- ✅ Track player scores and collections
- ✅ Allocate and claim rewards
- ✅ GraphQL API for all operations
- ✅ Real-time contract state queries

## 🎮 Try These Commands (in GraphiQL)

### Query: Check Stats
```graphql
{ totalMinted nextTokenId }
```

### Mutation: Mint Sticker
```graphql
mutation {
  mintSticker(
    owner: "player1"
    metadataUri: "ipfs://QmTest"
    stickerType: "rare"
  )
}
```

### Mutation: Update Score
```graphql
mutation {
  updateScore(tokenId: 1, score: 100)
}
```

## 🛠️ Tech Stack
- **Contract**: Rust + Linera SDK 0.15.5
- **Frontend**: Next.js 14 + Tailwind CSS
- **Container**: Docker + Docker Compose

## 📁 Key Files
- `contracts/src/contract.rs` - Business logic
- `contracts/src/state.rs` - State management
- `frontend/pages/index.js` - UI dashboard
- `run.bash` - Deployment automation

## ✅ Testing
```bash
./test.bash
# or
docker compose up --force-recreate
curl http://localhost:5173  # Should return HTML
```

## 🎨 What Makes It Special
1. **Full-stack dApp** - Contract + Frontend in one container
2. **Zero-config** - Deploys automatically with Docker
3. **Production-ready** - Tests pass, builds for WASM
4. **Well-documented** - 5+ README files with examples
5. **Extensible** - Easy to add new game mechanics

## 📖 Documentation
- `BUILDATHON.md` - Complete guide
- `contracts/EXAMPLES.md` - GraphQL examples
- `SUBMISSION_CHECKLIST.md` - Verification steps

## ⚡ Expected Behavior
1. Container starts local network
2. Deploys Drawn contract automatically
3. Shows frontend with contract info
4. GraphQL API ready to use
5. All mutations and queries work

---

**Questions?** Check `BUILDATHON.md` for full documentation.
