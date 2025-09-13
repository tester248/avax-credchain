# Module 2 — OnChain (Smart Contracts & Cross-Chain)

This folder contains the OnChain module for CredentialChain: smart contracts, unit tests, deployment scripts, and integration notes for other modules (Infra, App).

Key features
- IdentityRegistry.sol — register identities (stores IPFS CID and jurisdiction, consent flags). Uses AccessControl.
- VerificationAttestor.sol — create attestations by verifiers. Emits AttestationCreated events.
- CrossChainRouter.sol — integrates with a Teleporter messenger to request verification across subnets and emit responses.
- TeleporterMock.sol — a local mock Teleporter for development that can deliver messages to target router contracts on the same chain.

Quickstart (local dev)
1. Install dependencies

```bash
cd onchain
npm install
```

2. Compile & run tests

```bash
npx hardhat compile
npx hardhat test
```

3. Deploy locally (simple script)

```bash
npm run deploy
```

This deploys contracts using the first Hardhat signer and writes artifact files to `onchain/artifacts/` (for local runs the file is `local.json`). Example `local.json`:

```json
{
  "teleporter": "0x5F...",
  "router": "0xE7...",
  "identityRegistry": "0x9f...",
  "attestor": "0xCf...",
  "deployer": "0xF3...",
  "endpoints": null
}
```

Multi-network deploy (deploy to infra RPCs)

If you want to deploy to persistent RPC endpoints (for example the local subnet RPCs created by the Infra module), use the multi-network deploy script which reads `infra/endpoints.json` and deploys to each RPC using a provided private key.

1. Create `infra/endpoints.json` at the repository root with entries for each network (example below).

2. Export a deployer private key in your shell (do not commit keys):

```bash
export DEPLOYER_PRIVATE_KEY="0x..."
```

3. Run the multi network deploy from `onchain`:

```bash
cd onchain
npm run deploy:multi
```

This will deploy `TeleporterMock`, `CrossChainRouter`, `IdentityRegistry` and `VerificationAttestor` to each RPC in `infra/endpoints.json` and write `onchain/artifacts/{network}.json` for each network.


Integration checklist (mapping to onboarding acceptance criteria)
- `npm run infra:start-local` (Infra) provides `infra/endpoints.json` with `us`/`eu` RPC & teleporter addresses. (Infra)
- `npm run deploy` (OnChain) should be run per-network or once locally; it writes `onchain/artifacts/{network}.json` which the App and Infra modules consume. (OnChain) — Done: local deploy writes artifacts.
- CrossChainRouter integrates with Teleporter via `teleporter.sendMessage(destChainId, payload)`. The Teleporter implementation must call `handleIncomingMessage(bytes)` on destination router contracts. (OnChain)

Where App should look
- The frontend App should read contract addresses & ABIs from `onchain/artifacts/{network}.json`. The easiest pattern is for Infra to copy or symlink these files to a shared `shared/onchain-artifacts/` location for App consumption.

Updating this README
- When contract ABIs or function signatures change, update this README and bump the version in `package.json` so other modules know to re-integrate.


Integration points
- infra/endpoints.json (input): The infra module should produce this file with fields for `us` and `eu` subnets. Example:

```json
{
  "us": { "chainId": 1337, "subnetId": "<id>", "rpc": "http://localhost:8545", "teleporterAddr": "0x..." },
  "eu": { "chainId": 1338, "subnetId": "<id>", "rpc": "http://localhost:8546", "teleporterAddr": "0x..." }
}
```

- onchain/artifacts/{network}.json (output): Deployment artifacts containing addresses and ABIs. Currently the deploy script writes `onchain/artifacts/local.json`.

Contract integration contract
- CrossChainRouter.requestVerification(destChainId, user, requestedLevel) — sends a teleporter message payload: `abi.encode(requestId, user, requestedLevel)`. Teleporter implementation must forward to destination router's `handleIncomingMessage(bytes)` with a payload encoded as `(bytes32 requestId, bool verified, uint8 level)` for responses.

Notes for App module
- The frontend should read ABIs and addresses from `onchain/artifacts/{network}.json` for contract interactions.
- Do NOT store or display raw PII on-chain. Contracts accept IPFS CIDs and hashes only.

Next steps / todo
- Add TypeChain generation and include ABIs in a shared `shared/onchain-artifacts` folder.
- Improve TeleporterMock to simulate async delivery and message queues.
- Expand tests to include end-to-end cross-subnet flows using two local Hardhat networks or Dockerized nodes.

This README will be updated as the module evolves. If you change contract ABIs or deployment scripts, update this file so other modules can integrate smoothly.
