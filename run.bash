#!/usr/bin/env bash

set -eu

echo "🚀 Starting Linera local network..."
eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080
echo "📡 Initializing wallet with faucet: $LINERA_FAUCET_URL"
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# Build and publish the Drawn contract
echo "🔨 Building Drawn contract..."
cd /build/contracts
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown

echo "📦 Publishing Drawn application to local network..."
BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/drawn_contract.wasm \
  target/wasm32-unknown-unknown/release/drawn_service.wasm)

echo "Bytecode ID: $BYTECODE_ID"

echo "🎮 Creating Drawn application instance..."
APP_ID=$(linera create-application $BYTECODE_ID)

echo "Application ID: $APP_ID"
export DRAWN_APP_ID=$APP_ID

# Get the chain ID
CHAIN_ID=$(linera wallet show | grep "Public Key" -A 1 | tail -n 1 | awk '{print $1}')
export DRAWN_CHAIN_ID=$CHAIN_ID

echo "Chain ID: $CHAIN_ID"

# Start the Linera node service
echo "🌐 Starting Linera node service on port 8080..."
linera_spawn linera service --port 8080 --listener-skip-process-inbox

# Wait for service to be ready
sleep 3

echo "✅ Drawn contract deployed successfully!"
echo "📍 GraphiQL: http://localhost:8080/chains/$CHAIN_ID/applications/$APP_ID"

# Build and run the frontend
echo "🎨 Setting up frontend..."
cd /build/frontend

# Source nvm to make node/npm available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

pnpm install

# Create .env.local with contract details
cat > .env.local <<EOF
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8080/chains/$CHAIN_ID/applications/$APP_ID
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_APP_ID=$APP_ID
EOF

echo "🎯 Starting frontend on port 5173..."
pnpm dev --host 0.0.0.0 --port 5173
