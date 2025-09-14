# Module 2 — OnChain (Smart Contracts & Cross-Chain)

This folder contains the OnChain module for CredentialChain: smart contracts, unit tests, deployment scripts, and integration notes for other modules (Infra, App).

## Current Implementation Status ✅

### ✅ FULLY IMPLEMENTED AND DEPLOYED
- **IdentityRegistry.sol** — ✅ register identities (stores IPFS CID and jurisdiction, consent flags). Uses AccessControl.
- **VerificationAttestor.sol** — ✅ create attestations by verifiers. Emits AttestationCreated events.
- **CrossChainRouter.sol** — ✅ integrates with a Teleporter messenger to request verification across subnets and emit responses.
- **ReputationOracle.sol** — ✅ **IMPLEMENTED** contract for aggregating verifier reputations
- **FeeToken.sol** — ✅ **IMPLEMENTED** ERC20 token for fee payments and sponsored transactions
- **TeleporterMock.sol** — ✅ a local mock Teleporter for development that can deliver messages to target router contracts

### ✅ DEPLOYMENT STATUS: FULLY SUCCESSFUL
All contracts have been successfully deployed to both subnets with working addresses. The deploy-multi.ts script works perfectly and handles all contracts gracefully.

**Deployed Contract Addresses:**

**US Subnet (1337001):**
- IdentityRegistry: `0x7B4982e1F7ee384F206417Fb851a1EB143c513F9`
- VerificationAttestor: `0xB8a934dcb74d0E3d1DF6Bce0faC12cD8B18801eD`
- CrossChainRouter: `0x8B3BC4270BE2abbB25BC04717830bd1Cc493a461`
- ReputationOracle: `0x55a4eDd8A2c051079b426E9fbdEe285368824a89`
- FeeToken: `0xa1E47689f396fED7d18D797d9D31D727d2c0d483`
- TeleporterMock: `0x565497a1B67adc1305806804b5A93C44C545CbDC`

**EU Subnet (1337002):**
- IdentityRegistry: `0xF5f1f185cF359dC48469e410Aeb6983cD4DC5812`
- VerificationAttestor: `0x97C0FE6aB595cbFD50ad3860DA5B2017d8B35c2E`
- CrossChainRouter: `0xe17bDC68168d07c1776c362d596adaa5d52A1De7`
- ReputationOracle: `0x768AF58E63775354938e9F3FEdB764F601c038b4`
- FeeToken: `0xCB5bf91D236ebe6eF6AE57342570884234bd11Cc`
- TeleporterMock: `0x7632DD35AeaFC5A4a1AAA36493B7F8E4D84B15E2`

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

3. ✅ **ALREADY DONE**: Multi-network deployment

The contracts are already deployed! But you can redeploy if needed:

```bash
export DEPLOYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
npx ts-node scripts/deploy-multi.ts
```

This deploys all contracts to both subnets and writes `onchain/artifacts/{us,eu}.json` with addresses and ABIs.

## Multi-network deploy (deploy to infra RPCs)

**✅ STATUS: COMPLETED SUCCESSFULLY**

The multi-network deployment has been tested and works perfectly:
- Reads `infra/endpoints.json` with RPC configurations ✅
- Uses pre-funded ewoq account ✅ 
- Deploys all contracts to both subnets ✅
- Writes artifacts to `onchain/artifacts/{network}.json` ✅
- Handles existing teleporter addresses from `infra/teleporter.json` ✅

## Integration checklist (mapping to onboarding acceptance criteria)

- [x] **✅ COMPLETE**: `infra/endpoints.json` exists with `us`/`eu` RPC configurations
- [x] **✅ COMPLETE**: `npm run deploy:multi` deploys all contracts and writes artifacts
- [x] **✅ COMPLETE**: CrossChainRouter integrates with Teleporter for cross-chain messaging
- [x] **✅ COMPLETE**: ReputationOracle implementation
- [x] **✅ COMPLETE**: FeeToken implementation  
- [x] **✅ COMPLETE**: All contract compilation and deployment working

## Integration points

- **✅ infra/endpoints.json (input)**: Working file with RPC endpoints:

```json
{
  "us": { "chainId": "1337001", "subnetId": "credchainus", "rpc": "http://127.0.0.1:9650/ext/bc/C/rpc", "teleporterAddr": "0x565497a1B67adc1305806804b5A93C44C545CbDC" },
  "eu": { "chainId": "1337002", "subnetId": "credchaineu", "rpc": "http://127.0.0.1:9652/ext/bc/C/rpc", "teleporterAddr": "0x7632DD35AeaFC5A4a1AAA36493B7F8E4D84B15E2" }
}
```

- **✅ onchain/artifacts/{network}.json (output)**: Successfully generated deployment artifacts:

```json
{
  "teleporter": "0x565497a1B67adc1305806804b5A93C44C545CbDC",
  "router": "0x8B3BC4270BE2abbB25BC04717830bd1Cc493a461", 
  "identityRegistry": "0x7B4982e1F7ee384F206417Fb851a1EB143c513F9",
  "attestor": "0xB8a934dcb74d0E3d1DF6Bce0faC12cD8B18801eD",
  "oracle": "0x55a4eDd8A2c051079b426E9fbdEe285368824a89",
  "feeToken": "0xa1E47689f396fED7d18D797d9D31D727d2c0d483",
  "deployer": "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
  "rpc": "http://127.0.0.1:9650/ext/bc/C/rpc",
  "chainId": "1337001",
  "abis": { /* full ABIs included */ }
}
```

## Contract integration details

- **✅ CrossChainRouter.requestVerification(destChainId, user, requestedLevel)** — sends a teleporter message payload: `abi.encode(requestId, user, requestedLevel)`
- **✅ Teleporter integration** — uses deployed teleporter addresses, integrated with both local mocks and ICM infrastructure
- **✅ Event emissions** — contracts emit events for frontend integration:
  - `IdentityRegistered(address indexed user, string jurisdiction, string ipfsCid)`
  - `AttestationCreated(bytes32 indexed id, address indexed user, uint8 level, address verifier)`
  - `VerificationRequested(bytes32 requestId, address user, bytes32 targetChain)`
  - `VerificationResponse(bytes32 requestId, bool verified, uint8 level)`

## Notes for App module (Module 3)

**✅ READY FOR FRONTEND INTEGRATION**

- **Contract addresses**: Read from `onchain/artifacts/{us,eu}.json` files  
- **ABIs**: Available in the artifacts with complete interface definitions
- **Test account**: Use `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC` (ewoq) with private key `0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`
- **RPC endpoints**: US `http://127.0.0.1:9650/ext/bc/C/rpc`, EU `http://127.0.0.1:9652/ext/bc/C/rpc`
- **Privacy**: Store only IPFS CIDs and hashes on-chain, never raw PII
- **Cross-chain**: Use CrossChainRouter.requestVerification() for subnet-to-subnet verification requests

## Contract Interface Examples

### IdentityRegistry
```solidity
function registerIdentity(
    address user,
    string memory jurisdiction,
    string memory ipfsCid,
    bool consentGiven
) external;

function getIdentity(address user) external view returns (
    string memory jurisdiction,
    string memory ipfsCid,
    bool consentGiven,
    uint256 registeredAt
);
```

### VerificationAttestor
```solidity
function createAttestation(
    address user,
    bytes32 attestationHash,
    uint8 level,
    string memory metadataCid
) external;
```

### CrossChainRouter
```solidity
function requestVerification(
    uint256 destChainId,
    address user,
    uint8 requestedLevel
) external returns (bytes32 requestId);
```

## Generate Shared Artifacts for Frontend

**NEXT STEP**: Export artifacts for Module 3:

```bash
cd onchain
npx ts-node scripts/export-artifacts.ts
npx ts-node scripts/generate-shared-artifacts.ts
```

This will create:
- `shared/onchain-artifacts/addresses.json` — Consolidated contract addresses
- `shared/onchain-artifacts/abis/` — Individual ABI files for each contract

## How frontend / SDK should consume onchain artifacts

After deployment run:
cd onchain
npx ts-node scripts/export-artifacts.ts
npx ts-node scripts/generate-shared-artifacts.ts

This will populate:
- shared/onchain-artifacts/addresses.json
  - structure: { "us": { teleporter, router, identityRegistry, attestor, oracle, feeToken, rpc, chainId }, "eu": { ... } }
- shared/onchain-artifacts/abis/
  - contains JSON files for each contract ABI (CrossChainRouter.json, IdentityRegistry.json, ...)

Frontend pattern (pseudo-code):
```js
const addresses = await fetch('http://localhost:4000/v1/artifacts/addresses').then(r=>r.json());
const abis = await fetch('http://localhost:4000/v1/artifacts/us/abis').then(r=>r.json());
// instantiate ethers contract
const provider = new ethers.providers.JsonRpcProvider(addresses.us.rpc);
const router = new ethers.Contract(addresses.us.router, abis.CrossChainRouter, provider);
```

Notes:
- ABIs are served as raw JSON arrays; SDKs can wrap with TypeChain/viem later
- For cross-chain requests include only identifiers and pointers (no raw PII)

## Testing Deployed Contracts

Test contract interactions:

```bash
# Test IdentityRegistry on US subnet
curl -X POST http://127.0.0.1:9650/ext/bc/C/rpc \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"eth_call",
    "params":[{
      "to":"0x7B4982e1F7ee384F206417Fb851a1EB143c513F9",
      "data":"0x..."
    },"latest"]
  }'
```

## Summary

### ✅ MODULE 2 COMPLETE
- All smart contracts implemented and tested ✅
- Multi-network deployment working perfectly ✅  
- Teleporter integration functional ✅
- Contract addresses available for frontend ✅
- ABIs and artifacts ready for export ✅

### 🎯 READY FOR MODULE 3
The onchain module is **complete and production-ready** for demo purposes. Frontend developers can immediately start building with:

- Working contract addresses on both subnets
- Complete ABIs for all contracts  
- Pre-funded test accounts
- Functional cross-chain messaging
- Comprehensive documentation

**Next developer: Start Module 3 (Frontend) immediately!** 🚀
