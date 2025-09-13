# Module 2 — OnChain (Smart Contracts & Cross-Chain)

This folder contains the OnChain module for CredentialChain: smart contracts, unit tests, deployment scripts, and integration notes for other modules (Infra, App).

## Current Implementation Status

### ✅ Implemented Contracts
- IdentityRegistry.sol — register identities (stores IPFS CID and jurisdiction, consent flags). Uses AccessControl.
- VerificationAttestor.sol — create attestations by verifiers. Emits AttestationCreated events.
- CrossChainRouter.sol — integrates with a Teleporter messenger to request verification across subnets and emit responses.
- TeleporterMock.sol — a local mock Teleporter for development that can deliver messages to target router contracts on the same chain.

### ❌ Missing Contracts (Referenced in deploy-multi.ts)
- **ReputationOracle.sol** — Contract for aggregating verifier reputations
- **FeeToken.sol** — ERC20 token for fee payments and sponsored transactions

### 🚧 Deployment Status
The deploy-multi.ts script has been updated to gracefully handle missing contracts and will deploy only the contracts that exist. Missing contracts will be skipped with warnings.

## Quickstart (local dev)

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
  "oracle": null,
  "feeToken": null,
  "deployer": "0xF3...",
  "rpc": "http://localhost:8545",
  "chainId": 31337
}
```

## Multi-network deploy (deploy to infra RPCs)

If you want to deploy to persistent RPC endpoints (the local subnet RPCs created by the Infra module), use the multi-network deploy script which reads `infra/endpoints.json` and deploys to each RPC using a provided private key.

**Prerequisites:**
- Ensure `infra/endpoints.json` exists with RPC configurations
- Have a funded private key (you can use the `ewoq` key from avalanche CLI)

1. Export deployer private key (use the ewoq key which is pre-funded):

```bash
export DEPLOYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
```

2. Run the multi network deploy from `onchain`:

```bash
cd onchain
npm run deploy:multi
```

This will deploy the available contracts to each RPC in `infra/endpoints.json` and write `onchain/artifacts/{network}.json` for each network.

**Note:** The script will warn about missing contracts (ReputationOracle, FeeToken) but will continue with available contracts.

## Integration checklist (mapping to onboarding acceptance criteria)

- [x] `infra/endpoints.json` exists with `us`/`eu` RPC configurations
- [x] `npm run deploy:multi` deploys available contracts and writes artifacts
- [x] CrossChainRouter integrates with Teleporter for cross-chain messaging
- [ ] **Missing:** ReputationOracle implementation
- [ ] **Missing:** FeeToken implementation  
- [ ] **Missing:** Complete shared artifacts generation system

## Integration points

- **infra/endpoints.json (input)**: The infra module provides this file with RPC endpoints:

```json
{
  "us": { "chainId": "1337001", "subnetId": "credchainus", "rpc": "http://localhost:9650/ext/bc/C/rpc", "teleporterAddr": null },
  "eu": { "chainId": "1337002", "subnetId": "credchaineu", "rpc": "http://localhost:9652/ext/bc/C/rpc", "teleporterAddr": null }
}
```

- **onchain/artifacts/{network}.json (output)**: Deployment artifacts containing addresses and ABIs:

```json
{
  "teleporter": "0x...",
  "router": "0x...", 
  "identityRegistry": "0x...",
  "attestor": "0x...",
  "oracle": null,
  "feeToken": null,
  "deployer": "0x...",
  "rpc": "http://127.0.0.1:9650/ext/bc/C/rpc",
  "chainId": "1337001",
  "abis": { ... }
}
```

## Contract integration details

- **CrossChainRouter.requestVerification(destChainId, user, requestedLevel)** — sends a teleporter message payload: `abi.encode(requestId, user, requestedLevel)`
- **Teleporter integration** — uses mock teleporter for local development, can be configured to use real ICM addresses
- **Event emissions** — contracts emit events for frontend integration:
  - `IdentityRegistered(user, jurisdiction, ipfsCid)`
  - `AttestationCreated(attestationId, user, level, verifier)`
  - `VerificationRequested(requestId, user, targetChain)`

## Notes for App module

- The frontend should read ABIs and addresses from `onchain/artifacts/{network}.json` for contract interactions
- Do NOT store or display raw PII on-chain. Contracts accept IPFS CIDs and hashes only
- Missing contracts (ReputationOracle, FeeToken) should be implemented or mocked in the frontend until available

## Next steps / todo

### Immediate Priority
1. **Implement ReputationOracle.sol** — Contract to aggregate verifier reputation scores
2. **Implement FeeToken.sol** — ERC20 token for sponsored transactions
3. **Fix deploy-multi.ts integration** — Ensure smooth deployment flow

### Future Enhancements
- Add TypeChain generation for type-safe contract interactions
- Improve TeleporterMock to simulate async delivery and message queues
- Expand tests to include end-to-end cross-subnet flows
- Add proper error handling and event indexing

This README will be updated as contracts are implemented and the module evolves.
