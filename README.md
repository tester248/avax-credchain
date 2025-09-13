# Avax CredChain — Local Development & Deployment Guide

This repository contains a small end-to-end development environment for a credentialing / verification system running on Avalanche Subnet-EVMs. It includes:

- `infra/` — local subnet control, Teleporter (ICM) mock deployment, relayer helper scripts, utilities to generate dev keys, and infra-specific docs and CI.
- `onchain/` — Hardhat smart contracts, multi-network deployment scripts, and artifact export utilities.
- `shared/` — generated onchain artifacts (addresses.json, ABIs) that should be consumed by the frontend / SDK (Module 3).

Goal: provide a reproducible dev workflow so another developer (or CI runner) can start local subnets, deploy mock Teleporter, deploy onchain contracts to multiple subnets, generate shared artifacts, fund a relayer, and run a simple integration simulation.

Table of Contents
- Requirements
- Quickstart (fast path)
- Detailed setup (recommended for reproducible runs)
- Commands & scripts reference
- Environment variables
- Generating and exporting artifacts
- Relayer funding & integration sim
- Proposed Module 3 API (minimal design and endpoints)
- Troubleshooting
- Next steps / extension ideas

---

## Requirements

- Node.js (v18+ recommended)
- `pnpm` or `npm` — used to install dependencies in `infra/` and `onchain/` (we default to `npm` commands in examples)
- `avalanche` CLI (for subnet lifecycle management) — https://docs.avax.network/tools/avalanche-cli
- `npx` / `ts-node` for executing TypeScript scripts in-place
- Git and a POSIX-compatible shell (bash)

Note: CI runners can set up the same environment by installing Node and the Avalanche CLI. This README provides explicit commands to re-create the local environment.

## Quickstart (fast path)

These steps get you from clone → running local subnets → deployed Teleporter → deployed onchain contracts → generated shared artifacts.

1. Clone the repository and checkout the `module1` branch (or `main` when merged):

```bash
git clone <your-repo-url>
cd avax-credchain
git checkout module1
```

2. Install root dependencies (if any) and then install per-module dependencies. We prefer running installs in each folder to avoid global noise:

```bash
# optional at repo root if you add workspace scripts
# npm install

cd infra
npm install

cd ../onchain
npm install
```

3. Start the local subnets (this uses the Avalanche CLI). The `infra/scripts/subnet-control.ts` wrapper prefers `avalanche network start` if available.

```bash
cd infra
# start previously-deployed snapshot or start network
npx ts-node scripts/subnet-control.ts start

# check status
npx ts-node scripts/subnet-control.ts status
```

The script reads `infra/endpoints.json` and reports RPC reachability for each configured subnet. Default RPCs:

- `us` : `http://127.0.0.1:9650/ext/bc/C/rpc` (chainId `1337001`)
- `eu` : `http://127.0.0.1:9652/ext/bc/C/rpc` (chainId `1337002`)

4. Deploy the Mock Teleporter contract to all configured subnets and patch endpoints with the teleporter addresses. Provide the relayer/deployer private key as `RELAYER_PRIVATE_KEY`:

```bash
cd infra
export RELAYER_PRIVATE_KEY="0x..."   # use `avalanche key export <name>` to get the hex private key
npx ts-node scripts/deploy-teleporter.ts
```

This will write `infra/teleporter.json` and update `infra/endpoints.json` with `teleporterAddr` for each network.

5. Deploy onchain contracts across networks using Hardhat deploy-multi script. Provide a deployer private key that has AVAX on each subnet (prefunded in the subnet genesis when using `avalanche-cli` test defaults):

```bash
cd ../onchain
export DEPLOYER_PRIVATE_KEY="0x..."
npx ts-node scripts/deploy-multi.ts
```

This will deploy `CrossChainRouter` and related contracts on each configured network. The script is designed to merge teleporter addresses from `infra/teleporter.json` when `endpoints.json` lacks `teleporterAddr`.

6. Export and generate shared artifacts consumed by Module 3 (frontend / SDK):

```bash
npx ts-node scripts/export-artifacts.ts
npx ts-node scripts/generate-shared-artifacts.ts
```

This will populate `shared/onchain-artifacts/addresses.json` and `shared/onchain-artifacts/abis/` with network addresses and ABIs.

7. Fund the relayer account so it can submit transactions (sponsored flow). Use `infra/scripts/fund-relayer.ts`. The funder key should have enough AVAX to cover the transfer plus gas. Recommended transfer amount for local test: `0.5` AVAX to the relayer.

```bash
cd ../infra
export FUNDER_PRIVATE_KEY="0x..."   # usually the same as DEPLOYER_PRIVATE_KEY in dev
export RELAYER_ADDRESS="0x..."      # address of the relayer (or see infra/teleporter.json mappings)
export FUND_AMOUNT="0.5"            # AVAX to send
npx ts-node scripts/fund-relayer.ts
```

8. Run integration simulation (user -> relayer -> CrossChainRouter). Provide user and relayer private keys via env variables and run the integration sim script:

```bash
export USER_PRIVATE_KEY="0x..."
export RELAYER_PRIVATE_KEY="0x..."
npx ts-node scripts/integration-sim.ts
```

The integration sim will attempt a small end-to-end flow and print tx receipts.

---

## Detailed setup (recommended for reproducible runs / CI)

For a repeatable, automated setup (CI or a fresh machine), follow these steps:

1. Install Node.js LTS (v18+), `npm`, and `avalanche` CLI. On Ubuntu, for CI, you can script these installations. See Avalanche docs for `avalanche-cli` installation.

2. Ensure `avalanche` can create subnets. If you want to start from a clean snapshot, modify `infra/scripts/deploy-subnets.ts` parameters or use `avalanche network deploy` with `--test-defaults` to pre-fund genesis allocations.

3. Use environment management to store keys securely in CI (GitHub Actions secrets, Azure Key Vault, AWS Secrets Manager). Do NOT store private keys in the repository.

4. Sequence the steps in CI pipeline:
- Start subnets
- Deploy Teleporter
- Deploy onchain contracts
- Export shared artifacts and commit them or store them in an artifact bucket
- Run tests/integration

See `.github/workflows/infra-smoke.yml` for a sample job that runs a subset of smoke checks. (You may have edited this file — ensure your CI runner has `avalanche` installed or use a Docker image pre-bundled with the CLI.)

---

## Commands & scripts reference

- `infra/scripts/subnet-control.ts` — start/stop/status wrapper for local subnets
- `infra/scripts/deploy-teleporter.ts` — compile & deploy `MockTeleporter.sol` to each configured RPC and write `infra/teleporter.json`
- `infra/scripts/fund-relayer.ts` — send AVAX to relayer account
- `infra/scripts/generate-dev-key.ts` — create ephemeral dev key pairs for testing
- `infra/scripts/relayer.ts` — relayer implementation skeleton
- `infra/scripts/integration-sim.ts` — runs a small integration flow: create request, sign, and submit via relayer
- `onchain/scripts/deploy-multi.ts` — deploy contracts across multiple subnets
- `onchain/scripts/export-artifacts.ts` — copy compiled artifacts per-network to `shared/onchain-artifacts/` staging
- `onchain/scripts/generate-shared-artifacts.ts` — consolidate addresses.json and extract ABIs into `shared/onchain-artifacts/abis/`

Each script prints logs to STDOUT and writes outputs into `infra/` or `shared/` as described.

---

## Environment variables (summary)

- `RELAYER_PRIVATE_KEY` — Private key used by the relayer / teleporter deployer (0x-prefixed hex). Required for `infra/scripts/deploy-teleporter.ts` and `infra/scripts/relayer.ts`.
- `DEPLOYER_PRIVATE_KEY` — Private key used by `onchain/scripts/deploy-multi.ts` for smart contract deployment.
- `FUNDER_PRIVATE_KEY` — Private key used by `infra/scripts/fund-relayer.ts` to transfer AVAX to relayer.
- `RELAYER_ADDRESS` — Public address of relayer (used by fund-relayer script).
- `USER_PRIVATE_KEY` — Private key for the simulated user in `integration-sim.ts`.
- `FUND_AMOUNT` — Amount of AVAX to send in `fund-relayer.ts` (default `0.5`).

Important: Always use the raw hex private key exported from `avalanche key export <name>` and prefix it with `0x` when setting env vars.

---

## Generating and exporting artifacts (shared)

After successful contract deployments, we must expose the deployed addresses and ABIs to Module 3 (frontend/SDK). Use these scripts from the `onchain` folder:

```bash
cd onchain
npx ts-node scripts/export-artifacts.ts
npx ts-node scripts/generate-shared-artifacts.ts
```

Output location: `shared/onchain-artifacts/addresses.json` and `shared/onchain-artifacts/abis/`.

The `addresses.json` has this shape:

```json
{
  "us": { "chainId": "1337001", "rpc": "http://127.0.0.1:9650/ext/bc/C/rpc", "teleporter": "0x...", "router": "0x...", ...},
  "eu": { "chainId": "1337002", "rpc": "http://127.0.0.1:9652/ext/bc/C/rpc", "teleporter": "0x...", "router": "0x...", ...}
}
```

Frontend/SDKs should read these artifacts at startup to configure RPC endpoints and contract addresses.

---

## Relayer funding & integration sim

To run the integration sim locally:

1. Ensure `shared/onchain-artifacts/addresses.json` is present and has `router` and `teleporter` addresses.
2. Provide `RELAYER_PRIVATE_KEY` and `USER_PRIVATE_KEY` env vars.
3. Ensure relayer address has some AVAX (fund with `fund-relayer.ts`).
4. Run `npx ts-node infra/scripts/integration-sim.ts` — the script will print the signed user request, relayer submission details, and receipts.

Edge cases handled by scripts:
- Missing private key formats (scripts expect 0x-prefixed hex)
- Insufficient funds when funding relayer (script will print balances and failure reasons)

---

## Proposed Module 3 API (minimal interface for frontend / SDK)

Rationale: repeatedly setting env vars and running `ts-node` is fine for dev but not for frontend apps or CI. Module 3 (frontend or SDK) needs a stable HTTP/JSON API that exposes the necessary data and actions. Below is a minimal, secure API design that can live under `infra/api/` and be implemented as a small Express/TypeScript service.

Authentication: for local dev you can use a simple HMAC or API key. For production, integrate OAuth/OIDC or JWTs.

Suggested endpoints (read-only unless authenticated):

- `GET /v1/networks` — returns available networks and RPC endpoints from `infra/endpoints.json` or `shared/onchain-artifacts/addresses.json`.
  - Response: list of networks with chainId, rpc, teleporter, router addresses.

- `GET /v1/artifacts/:network/abis` — lists available ABIs for a network (or return ABIs bundle). Useful for SDK to instantiate contract wrappers.

- `GET /v1/artifacts/addresses` — returns `shared/onchain-artifacts/addresses.json`.

- `POST /v1/relayer/submit` — submit a signed payload (user request) to be sent by the relayer. Body contains: `{ network, signedPayload, signerAddress, meta }`.
  - This endpoint is authenticated and accepts the signed message from the frontend. The server verifies signature + nonces + payments and forwards to the relayer (or enqueue the job).
  - Response: `{ jobId, status }` and a separate `GET /v1/relayer/status/:jobId` to poll.

- `GET /v1/relayer/status/:jobId` — returns job status and tx receipts when available.

Implementation notes:
- A minimal prototype can be implemented with Express, using the `ethers` library to verify signatures and a local worker/process to forward to `infra/scripts/relayer.ts`.
- Use persistent storage (SQLite or Redis) for job tracking and nonce management.

Security considerations:
- Never accept raw private keys from clients.
- Validate and enforce limits (gas, AVAX transfer sizes) to prevent misuse.
- Rate-limit `/v1/relayer/submit` and require authentication for production.

---

## Troubleshooting

- Invalid private key errors: ensure env vars use 0x-prefixed raw private key hex exported with `avalanche key export <name>`.
- RPC 404s: ensure RPC path uses `/ext/bc/C/rpc`. The `infra/endpoints.json` uses this path by default.
- Insufficient funds when sending AVAX: check funder balance and lower `FUND_AMOUNT`. The `fund-relayer.ts` logs the funder's balance before sending.
- Hardhat artifact not found: ensure you ran `npx hardhat compile` (or run the `deploy-multi.ts` script from `onchain/` which triggers compilation).

---

## Next steps / extension ideas

- Implement the `infra/api/` HTTP server and a small `infra/api/README.md` with example cURL or SDK usage.
- Add lightweight integration tests that:
  1. start subnets (headless),
  2. deploy teleporter and onchain contracts,
  3. run the integration sim,
  4. assert token/state changes.
- Add CI pipeline steps to start a Dockerized Avalanche node (or use a prebuilt image) so CI doesn't install the CLI on the runner.

---

If you want, I can also scaffold the `infra/api/` Express service and wire it to serve `shared/onchain-artifacts` and a `/v1/relayer/submit` endpoint and add basic tests. Would you like me to generate that now?
