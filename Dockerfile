FROM rust:1.86-slim

SHELL ["bash", "-c"]

RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Linera tools
RUN cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5

# Install Node.js via nvm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.40.3/install.sh | bash \
    && . ~/.nvm/nvm.sh \
    && nvm install lts/krypton \
    && npm install -g pnpm

# Add wasm32 target for contract building
RUN rustup target add wasm32-unknown-unknown

WORKDIR /build

# Expose ports
# 5173 - Frontend (Next.js dev server)
# 8080 - Linera faucet & node service
# 9001 - Shard proxy
# 13001 - Shard
EXPOSE 5173 8080 9001 13001

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:5173 || exit 1

ENTRYPOINT ["bash", "/build/run.bash"]
