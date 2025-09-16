# Shared Contract Artifacts

This directory contains compiled smart contract artifacts, ABIs, and deployment addresses shared across all modules in the CredChain system.

## Overview

The shared artifacts directory serves as the central repository for:

- Contract ABIs for frontend integration
- Deployed contract addresses by network
- Contract metadata and deployment information
- Debug information for development

## Directory Structure

```
shared/onchain-artifacts/
├── abis/                     # Contract ABIs for frontend consumption
│   ├── CrossChainRouter.json
│   ├── IdentityRegistry.json
│   ├── VerificationAttestor.json
│   └── ...
├── addresses.json            # Contract addresses by network
├── credchainus.json         # Network-specific deployment info
└── *.dbg.json               # Debug artifacts with bytecode
```

## Key Files

### addresses.json
Consolidated mapping of contract addresses across all networks:

```json
{
  "credchainus": {
    "chainId": "1337001",
    "rpc": "http://127.0.0.1:35885/ext/bc/...",
    "crossChainRouter": "0xA4cD3b0Eb6E5Ab5d8CE4065BcCD70040ADAB1F00",
    "identityRegistry": "0xa4DfF80B4a1D748BF28BC4A271eD834689Ea3407",
    "verificationAttestor": "0x95CA0a568236fC7413Cd2b794A7da24422c2BBb6"
  }
}
```

### abis/ Directory
Contains individual ABI files for each contract, used by:
- Frontend applications for contract interaction
- API services for blockchain integration
- Development tools and testing frameworks

## Usage by Modules

### API Integration
The module3-api service exposes these artifacts via REST endpoints:

- `GET /api/contracts/addresses` - Returns addresses.json
- `GET /api/contracts/abis` - Returns all contract ABIs
- `GET /v1/artifacts/:network/abis` - Network-specific ABIs

### Frontend Integration
Frontend applications consume these artifacts to:
- Connect to deployed contracts
- Generate contract interaction interfaces
- Validate transaction parameters

### Development Tools
Development scripts use these artifacts for:
- Integration testing
- Contract verification
- Cross-chain message routing

## Regenerating Artifacts

When contracts are modified or redeployed, regenerate artifacts:

```bash
# From the onchain directory
cd onchain

# Compile contracts
npx hardhat compile

# Export artifacts to shared directory
npx ts-node scripts/export-artifacts.ts

# Generate consolidated addresses and ABIs
npx ts-node scripts/generate-shared-artifacts.ts
```

## Artifact Generation Process

1. **Compilation**: Hardhat compiles contracts and generates artifacts
2. **Export**: Scripts copy artifacts to shared directory
3. **Processing**: Addresses are extracted and ABIs are cleaned
4. **Consolidation**: All network deployments are merged into unified files

## Version Management

- Artifacts are version-controlled to track deployment history
- Each deployment creates timestamped backup files
- Network-specific artifacts maintain deployment metadata

## Security Considerations

- Contract addresses are public information
- ABIs contain no sensitive data
- Debug artifacts should not be deployed to production
- Verify artifact integrity before production use

## Development Tips

- Keep shared artifacts as the single source of truth
- Update artifacts immediately after contract deployment
- Use consistent naming conventions across networks
- Include deployment metadata for audit trails

## Integration Examples

### Frontend Contract Interaction

```javascript
// Load contract address and ABI
const addresses = await fetch('/api/contracts/addresses').then(r => r.json());
const abis = await fetch('/api/contracts/abis').then(r => r.json());

// Create contract instance
const contract = new ethers.Contract(
  addresses.credchainus.identityRegistry,
  abis.IdentityRegistry,
  provider
);
```

### API Service Integration

```javascript
// API service reading artifacts
const fs = require('fs');
const path = require('path');

const addressesPath = path.join(__dirname, '../shared/onchain-artifacts/addresses.json');
const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
```

## Troubleshooting

**Missing Artifacts**:
- Run artifact generation scripts
- Verify contract compilation completed successfully
- Check file permissions and paths

**Outdated Addresses**:
- Regenerate artifacts after contract deployment
- Verify network configuration matches deployment
- Check for deployment script errors

**ABI Compatibility Issues**:
- Ensure contract compilation succeeded
- Verify ABI extraction process
- Check for contract interface changes
