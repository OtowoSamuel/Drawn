# Drawn

Drawn is a modular dApp scaffold that separates concerns across three layers: frontend, backend, and blockchain contracts. This repository provides starter code and guidance so you can iterate quickly on the UI, API, and smart contract logic.

## 🚀 Quick Start (Buildathon Submission)

**For buildathon judges and testers:**

```bash
docker compose up --force-recreate
```

Then visit http://localhost:5173

See [`BUILDATHON.md`](./BUILDATHON.md) for complete instructions and [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) for a summary.

## Key design principles
- Clear separation of concerns: UI (frontend), application & persistence (backend), and on-chain logic (contracts).
- Practical defaults: Next.js + Tailwind for frontend, Node/Express for lightweight backend APIs, IPFS for asset storage.
- Chain-accurate contracts: This project targets Linera-style Rust smart contracts (not Solidity). See the Contracts section for details.

Technical architecture (high-level)

- Frontend
	- React (Next.js is used in this scaffold but plain React/Vite is fine)
	- Tailwind CSS for styling
	- Wallet integration: Linear/Linera Wallet SDK or other compatible wallet provider (connect, sign transactions)

- Backend
	- Node.js + Express for simple API endpoints and relayer logic
	- Optional persistence: Supabase or Firebase for user and game state
	- Optional IPFS/Pinata pinning service for storing sticker assets & metadata

- Blockchain layer
	- Linera-style chain (Rust-based smart contracts). Smart contracts should be implemented in Rust using the chain's recommended SDK/tooling.
	- On-chain modules to implement: NFT minting, gameplay state/logic, and rewards distribution.

- Storage
	- Asset & metadata storage: IPFS (pin with Pinata or other pinning provider). Store immutable URIs on-chain.

Repository layout

- `frontend/` — Next.js + Tailwind starter, sample pages, and a notes file for wallet integration.
- `backend/` — Express server skeleton and placeholder endpoints (metadata, health). Add Supabase/Firebase integration here.
- `contracts/` — Placeholder for smart contracts. IMPORTANT: the scaffold currently contains Solidity examples; the project should be migrated to Rust smart contracts for Linera. See Contracts section for recommended approach.
- `tests/` — Guidance and placeholders for running contract and backend tests.

Quick start (local development)

1) Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

2) Backend

```bash
cd backend
npm install
npm run dev
# default: http://localhost:3001
curl http://localhost:3001/health
curl http://localhost:3001/api/metadata/1
```

3) Contracts (Rust / Linera)

The contracts are implemented in Rust for the Linera blockchain. See `contracts/README.md` for full documentation.

Quick build and test:

```bash
cd contracts
cargo test
cargo build --release --target wasm32-unknown-unknown
```

The WASM bytecode will be at:
- `target/wasm32-unknown-unknown/release/drawn_contract.wasm`
- `target/wasm32-unknown-unknown/release/drawn_service.wasm`

See `contracts/EXAMPLES.md` for GraphQL query/mutation examples.

Testing

- Backend: Jest + Supertest are configured in `backend/package.json` (placeholder). Run `npm test` in `backend/`.
- Contracts: write Rust unit tests (`cargo test`) and integration tests that run against a local devnet.

Environment & configuration

- Use `.env` files at the `backend/` and `frontend/` levels for API keys, DB URLs, pinata keys, wallet redirect URIs, etc. Example entries:
	- `SUPABASE_URL`, `SUPABASE_KEY`
	- `PINATA_API_KEY`, `PINATA_SECRET`
	- `LINERA_RPC_URL`, `LINERA_PRIVATE_KEY`

Security & best practices

- Keep private keys and secrets out of source control. Use environment variables and secure storage for CI.
- Validate and sanitize any user-supplied data on the backend before interacting with the chain.
- For on-chain logic, prioritize formal reasoning and audits for economic or access controls.

CI / automation suggestions

- Add a CI workflow to run backend unit tests and contract unit tests (Rust `cargo test`) on push/PR.
- Add a linting/format check for Rust (rustfmt/clippy) and JS (eslint / prettier) in CI.


Contacts & references

- Linera / chain docs: follow the official chain documentation for contract toolchain and SDK details.
- IPFS / Pinata docs for pinning APIs.



