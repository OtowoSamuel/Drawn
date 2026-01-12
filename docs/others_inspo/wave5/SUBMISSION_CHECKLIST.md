# Linera Buildathon Submission Checklist

## ✅ Pre-Submission Verification

### Docker Setup
- [x] `Dockerfile` configured with all dependencies
- [x] `compose.yaml` with correct port mappings (5173, 8080, 9001, 13001)
- [x] `run.bash` script builds and deploys contract
- [x] Healthcheck configured for frontend (localhost:5173)
- [x] `.dockerignore` to optimize build times

### Contract
- [x] Rust smart contract in `contracts/` folder
- [x] Builds successfully for `wasm32-unknown-unknown`
- [x] Unit tests pass (`cargo test`)
- [x] Deployed and runs on local network
- [x] GraphQL mutations and queries work

### Frontend
- [x] Next.js app in `frontend/` folder
- [x] Runs on port 5173
- [x] Displays contract information
- [x] Shows deployed chain and app IDs
- [x] Provides link to GraphiQL interface

### Documentation
- [x] Main `README.md` with project overview
- [x] `BUILDATHON.md` with quick start instructions
- [x] `contracts/README.md` with contract details
- [x] `contracts/EXAMPLES.md` with query examples
- [x] `DEPLOYMENT.md` for testnet deployment

## 🧪 Testing

Run the test script to verify everything works:

```bash
./test.bash
```

Or manually:

```bash
# Clean start
docker compose down -v
docker compose up --force-recreate --build

# Wait for healthcheck to pass (~30-60s)
# Check logs
docker compose logs -f app

# Access frontend
open http://localhost:5173

# Test GraphQL (get URL from frontend)
```

## 📋 Submission Requirements

### Required
- [x] Docker container runs successfully
- [x] Frontend accessible on localhost:5173
- [x] Contract deploys to local network
- [x] Healthcheck passes
- [x] Clear documentation

### Expected Behavior
1. **`docker compose up --force-recreate`** should:
   - Start local Linera network
   - Initialize wallet
   - Build Rust contract
   - Deploy contract to network
   - Start node service on port 8080
   - Start frontend on port 5173
   - Pass healthcheck within 60 seconds

2. **Frontend (localhost:5173)** should show:
   - Contract connection status
   - Chain ID and Application ID
   - Link to GraphiQL interface
   - Current contract stats (total minted)
   - Example queries

3. **GraphQL (localhost:8080)** should respond to:
   - Queries: `{ totalMinted nextTokenId }`
   - Mutations: `mintSticker`, `updateScore`, `allocateReward`

## 🚀 Final Steps

1. **Test locally**
   ```bash
   ./test.bash
   ```

2. **Verify all ports work**
   - http://localhost:5173 - Frontend ✅
   - http://localhost:8080 - Faucet/Service ✅

3. **Check logs for errors**
   ```bash
   docker compose logs app | grep -i error
   ```

4. **Verify healthcheck**
   ```bash
   docker inspect drawn-app --format='{{.State.Health.Status}}'
   ```

5. **Take screenshots**
   - Frontend showing contract info
   - GraphiQL with successful query
   - Docker logs showing deployment

6. **Clean up test**
   ```bash
   docker compose down -v
   ```

## 📦 What to Submit

### Repository Contents
- [x] All source code
- [x] Dockerfile
- [x] compose.yaml
- [x] run.bash
- [x] Documentation (README files)

### Optional (but helpful)
- [x] Test script (`test.bash`)
- [x] Submission checklist (this file)
- [x] Example queries
- [x] Deployment guide

## 🎯 Success Criteria

The submission is ready when:

✅ `docker compose up --force-recreate` starts successfully  
✅ Healthcheck passes within 60 seconds  
✅ Frontend loads on localhost:5173  
✅ Contract info displays correctly  
✅ GraphQL interface is accessible  
✅ Sample mutations execute successfully  
✅ No critical errors in logs  

## 💡 Tips

1. **First-time builders**: The first `docker compose up` can take 10-15 minutes to download and build everything. Subsequent runs are faster.

2. **Network issues**: If faucet fails, check that ports 8080, 9001, 13001 are not in use.

3. **Frontend not loading**: Check that the contract deployed successfully in the logs:
   ```bash
   docker compose logs app | grep "Application ID"
   ```

4. **Testing mutations**: Use the GraphiQL interface linked from the frontend to test all contract operations.

5. **Clean testing**: Always use `--force-recreate` for submission testing to ensure a clean environment.

## 📞 Support

If issues persist:
1. Check `docker compose logs app` for detailed error messages
2. Verify Docker and Docker Compose versions
3. Ensure ports 5173, 8080, 9001, 13001 are available
4. Try `docker compose down -v && docker compose up --build --force-recreate`

---

**Ready to submit?** ✨

Make sure `./test.bash` passes, then submit your repository!
