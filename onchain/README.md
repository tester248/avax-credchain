# Smart Contracts Module

This module contains the core smart contracts, deployment scripts, and testing infrastructure for the CredChain credential verification system.

## Overview

The smart contracts module implements the core blockchain logic for:

- Identity registration and management
- Credential verification and attestation
- Cross-chain communication via Avalanche ICM
- Reputation tracking and validation
- Fee token management and sponsored transactions

## Contract Architecture

### Core Contracts

**IdentityRegistry.sol**: Central registry for identity management
- Stores identity metadata with IPFS CID references
- Manages jurisdiction and consent flags
- Implements access control for identity operations

**VerificationAttestor.sol**: Handles credential verification workflows
- Creates and manages attestations from verified sources
- Emits attestation events for off-chain tracking
- Integrates with reputation scoring system

**CrossChainRouter.sol**: Manages cross-chain communication
- Integrates with Avalanche ICM Teleporter protocol
- Routes verification requests across subnets
- Handles cross-chain response processing

**ReputationOracle.sol**: Aggregates verifier reputation data
- Tracks verifier performance metrics
- Implements reputation scoring algorithms
- Provides reputation data for attestation validation

**FeeToken.sol**: Custom ERC20 token for system operations
- Handles transaction fees and sponsored transactions
- Implements token-based incentive mechanisms
- Supports cross-chain fee payments

**TeleporterMock.sol**: Development mock for ICM testing
- Simulates Teleporter functionality for local development
- Enables end-to-end testing without full ICM deployment

## Deployed Contracts

Current deployment on credchainus subnet (Chain ID: 1337001):

- **TeleporterMock**: `0x4Ac1d98D9cEF99EC6546dEd4Bd550b0b287aaD6D`
- **CrossChainRouter**: `0xA4cD3b0Eb6E5Ab5d8CE4065BcCD70040ADAB1F00`
- **IdentityRegistry**: `0xa4DfF80B4a1D748BF28BC4A271eD834689Ea3407`
- **VerificationAttestor**: `0x95CA0a568236fC7413Cd2b794A7da24422c2BBb6`
- **FeeToken**: `0x789a5FDac2b37FCD290fb2924382297A6AE65860`

## Installation

Install dependencies from the onchain directory:

```bash
cd onchain
npm install
```

## Development

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy Contracts

Deploy to the configured credchainus network:

```bash
npx hardhat run scripts/deploy.ts --network credchainus
```

For multi-network deployment:

```bash
npx ts-node scripts/deploy-multi.ts
```

## Deployment Scripts

**deploy.ts**: Single network deployment script
- Deploys all contracts to specified network
- Configures contract interactions and permissions
- Generates deployment artifacts

**deploy-multi.ts**: Multi-network deployment script
- Reads network configuration from `infra/endpoints.json`
- Deploys contracts across multiple subnets
- Writes artifacts for each network

**export-artifacts.ts**: Artifact export utility
- Copies compiled artifacts to shared directory
- Organizes artifacts by network and contract type

**generate-shared-artifacts.ts**: Shared artifact generator
- Consolidates contract addresses across networks
- Extracts ABIs for frontend integration
- Creates unified configuration files

## Configuration

### Network Configuration

The deployment system reads network configuration from `infra/endpoints.json`:

```json
{
  "credchainus": {
    "chainId": "1337001",
    "subnetId": "credchainus",
    "rpc": "http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc",
    "teleporterAddr": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
  }
}
```

### Hardhat Configuration

The `hardhat.config.ts` file defines:
- Network settings for local and testnet deployment
- Compiler configuration and optimization settings
- TypeChain generation settings
- Testing and verification parameters

## Integration Points

### Input Dependencies
- **infra/endpoints.json**: Network RPC endpoints and configuration
- **infra/teleporter.json**: ICM Teleporter contract addresses

### Output Artifacts
- **artifacts/{network}.json**: Per-network deployment addresses
- **shared/onchain-artifacts/addresses.json**: Consolidated address mapping
- **shared/onchain-artifacts/abis/**: Contract ABI files for frontend integration

## Testing

The test suite includes:

- Unit tests for individual contract functionality
- Integration tests for cross-contract interactions
- Mock testing for ICM Teleporter integration
- Gas optimization and security tests

Run specific test categories:

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/IdentityRegistry.test.ts

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## Security Considerations

- All contracts implement OpenZeppelin's AccessControl for permission management
- Input validation and bounds checking on all public functions
- Reentrancy protection on state-changing operations
- Event emission for all critical operations for off-chain monitoring

## Gas Optimization

The contracts are optimized for gas efficiency:

- Use of packed structs to minimize storage slots
- Efficient data structures and algorithms
- Minimized external calls and loops
- Proper use of view and pure functions

## Troubleshooting

**Compilation Issues**:
- Ensure Solidity version compatibility
- Check import paths and dependency versions
- Verify OpenZeppelin contract versions

**Deployment Failures**:
- Verify network configuration and RPC connectivity
- Check account balance and gas settings
- Ensure proper private key configuration

**Integration Issues**:
- Verify artifact generation and export processes
- Check contract address consistency across modules
- Validate ABI compatibility with frontend integration
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
