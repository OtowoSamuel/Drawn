#!/usr/bin/env bash

# Test script for Drawn Docker container
# Run this to verify the buildathon submission works

set -e

echo "🧪 Testing Drawn Docker Container"
echo "=================================="
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose v2."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose down -v 2>/dev/null || true
echo ""

# Build and start
echo "🏗️  Building and starting container..."
echo "This may take several minutes on first run..."
docker compose up --build --force-recreate -d

echo ""
echo "⏳ Waiting for container to be healthy..."
echo "This can take 30-60 seconds..."

# Wait for healthcheck (max 2 minutes)
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH=$(docker inspect drawn-app --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    
    if [ "$HEALTH" = "healthy" ]; then
        echo "✅ Container is healthy!"
        break
    fi
    
    echo "   Status: $HEALTH (${ELAPSED}s elapsed)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "❌ Container failed to become healthy within ${TIMEOUT}s"
    echo ""
    echo "Container logs:"
    docker compose logs app
    exit 1
fi

echo ""
echo "🎉 Drawn is running!"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost:5173"
echo "   GraphiQL:  Check frontend for contract URL"
echo "   Faucet:    http://localhost:8080"
echo ""
echo "🔍 View logs:"
echo "   docker compose logs -f app"
echo ""
echo "🛑 Stop container:"
echo "   docker compose down"
echo ""
echo "✅ Test complete! Visit http://localhost:5173 to see the app."
