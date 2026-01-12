FROM rust:1.86-slim

SHELL ["bash", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    jq \
    curl

# Install Linera services (version 15.8)
RUN cargo install --locked linera-service@15.8 linera-storage-service@15.8

# Install Node.js LTS (for frontend)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Set working directory
WORKDIR /build

# Healthcheck on frontend port
HEALTHCHECK CMD ["curl", "-s", "http://localhost:5173"]

# Run the application
ENTRYPOINT bash /build/run.bash
