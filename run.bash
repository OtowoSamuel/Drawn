#!/usr/bin/env bash

set -eu

# ============================================================================
# Drawn Tic-Tac-Toe - Local Deployment Script  
# Template-compliant with auto-extraction
# ============================================================================

echo "Drawn Tic-Tac-Toe - Local Deployment"
echo "========================================"

# Configuration - Template standard: faucet on 8080
FAUCET_PORT=8080
SERVICE_PORT=8081

# Setup PATH and environment
export PATH="$PWD/target/debug:$PATH"
source /dev/stdin <<<"$(linera net helper 2>/dev/null)"

# Start Linera network
echo "🚀 Starting Linera network..."
linera_spawn linera net up --with-faucet --faucet-port $FAUCET_PORT

# Wait for network to stabilize
sleep 2

echo "READY!"

# Set environment variables for wallet
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"

FAUCET_URL="http://localhost:$FAUCET_PORT"

# Initialize wallet
echo "💼 Initializing wallet..."
linera --with-wallet 1 wallet init --faucet "$FAUCET_URL"

# Request chain from faucet and extract chain ID + owner address
echo "⛓️  Requesting chain from faucet..."
CHAIN_OUTPUT=$(linera --with-wallet 1 wallet request-chain --faucet "$FAUCET_URL" 2>&1)

# Extract chain ID (first 64-char hex line)
CHAIN_1=$(echo "$CHAIN_OUTPUT" | grep -E '^[a-f0-9]{64}$' | head -1)

# Extract owner address from log line: "Requesting a new chain for owner 0x..."
OWNER_ADDRESS=$(echo "$CHAIN_OUTPUT" | grep -oP 'owner\s+\K0x[0-9a-f]{64}' | head -1)

echo "✅ Main Chain: $CHAIN_1"
echo "✅ Owner Address: $OWNER_ADDRESS"

# Sync wallet
linera --with-wallet 1 sync && linera --with-wallet 1 query-balance

# Build contracts
echo "Building contracts..."
cd contracts
cargo build --release --target wasm32-unknown-unknown
cd ..

# Deploy application
echo "Deploying Tic-Tac-Toe application..."
cd contracts

# Deploy using 'linera project publish-and-create'
APP_ID=$(linera --with-wallet 1 --wait-for-outgoing-messages project publish-and-create .)

cd ..

if [ -z "$APP_ID" ]; then
  echo "❌ Failed to deploy application!"
  exit 1
fi

echo "✅ Application deployed: $APP_ID"

# Start GraphQL service
echo "Starting GraphQL service on port $SERVICE_PORT..."
linera --with-wallet 1 service --port $SERVICE_PORT &
sleep 2

# Configure frontend with ALL needed variables
echo "⚙️  Configuring frontend..."
cd frontend

cat > .env.local <<EOF
VITE_APP_ID=$APP_ID
VITE_CHAIN_ID=$CHAIN_1
VITE_OWNER_ADDRESS=$OWNER_ADDRESS
VITE_GRAPHQL_ENDPOINT=http://localhost:$SERVICE_PORT
EOF

echo "✅ Frontend configured"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

echo ""
echo "════════════════════════════════════════"
echo "  🎮 Drawn Tic-Tac-Toe Ready!"
echo "════════════════════════════════════════"
echo ""
echo "  Main Chain:  $CHAIN_1"
echo "  Application: $APP_ID"  
echo "  Owner:       $OWNER_ADDRESS"
echo ""
echo "  GraphQL Service:"
echo "  http://localhost:$SERVICE_PORT"
echo ""
echo "  GraphQL IDE:"
echo "  http://localhost:$SERVICE_PORT/chains/$CHAIN_1/applications/$APP_ID"
echo ""
echo "  Frontend will start at:"
echo "  http://localhost:5173"
echo ""
echo "════════════════════════════════════════"
echo ""
echo "🚀 Starting frontend..."
echo ""

# Start frontend dev server
npm run dev
