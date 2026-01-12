# Docker Deployment Guide - Drawn Tic-Tac-Toe

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- 8GB+ RAM available for Docker

## Quick Start

### 1. Build and Run

```bash
docker compose up --build
```

This will:
- Build the Docker image (first time takes ~10-15 minutes)
- Install Linera services (version 15.8)
- Install Node.js for frontend
- Start the application

### 2. Access the Application

Once you see:
```
VITE v5.4.19  ready in XXXms
➜  Local:   http://localhost:8082/
```

**Open your browser:**
```
http://localhost:8082/game
```

### 3. Play!

1. Click "Start Single Player Game"
2. Click cells to place X and O
3. You control both players (single-player demo mode)

---

## Ports Used

| Port | Service | Description |
|------|---------|-------------|
| 8080 | Faucet | Linera token faucet |
| 8081 | GraphQL | Backend GraphQL API |
| 8082 | Frontend | Vite dev server (React app) |
| 9001 | Shard Proxy | Linera shard proxy |
| 13001 | Shard | Linera validator shard |

---

## Folder Structure

✅ **Used:**
- `contracts/` - Linera smart contracts (backend logic)
- `frontend/` - React frontend application
- `run.bash` - Startup script

❌ **NOT Used (can be deleted):**
- `backend/` - Old structure, NOT following Linera patterns

---

## Troubleshooting

### Port Already in Use
```bash
#Find and kill processes
lsof -ti:8080 | xargs kill -9
lsof -ti:8081 | xargs kill -9
lsof -ti:8082 | xargs kill -9
```

### Out of Memory
- Increase Docker memory to 8GB+ in Docker Desktop settings

### Frontend Not Loading  
- Wait for "VITE ready" message
- Hard refresh: `Ctrl + Shift + R`
- Try incognito mode

---

## Cleanup

```bash
# Stop containers
docker compose down

# Remove volumes (reset state)
docker compose down -v

# Remove everything
docker compose down -v --rmi all
```
