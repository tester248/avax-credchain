# Infrastructure Module

This module manages the Avalanche subnet infrastructure, including subnet deployment, network configuration, and Inter-Chain Messaging (ICM) setup for the CredChain credential verification system.

## Overview

The infrastructure module provides:

- Avalanche subnet deployment and management scripts
- Network configuration for multiple subnets
- ICM Teleporter integration for cross-chain messaging
- Development utilities for key generation and account funding
- Integration testing framework

## Prerequisites

- Avalanche CLI installed and configured
- Node.js v18+ and npm
- POSIX-compatible shell environment

## Installation

Install dependencies from the infra directory:

```bash
cd infra
npm install
```

## Network Configuration

The system currently operates on the following networks:

**credchainus Subnet**:
- Chain ID: 1337001
- RPC Endpoint: `http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc`
- ICM Teleporter: `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`

## Available Scripts

### Subnet Management

**subnet-control.ts**: Manages subnet lifecycle operations
```bash
npx ts-node scripts/subnet-control.ts start
npx ts-node scripts/subnet-control.ts stop
npx ts-node scripts/subnet-control.ts status
```

### Contract Deployment

**deploy-teleporter.ts**: Deploys Teleporter mock contracts
```bash
export RELAYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
npx ts-node scripts/deploy-teleporter.ts
```

### Account Management

**fund-relayer.ts**: Funds relayer accounts with AVAX
```bash
export FUNDER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
export RELAYER_ADDRESS="0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
npx ts-node scripts/fund-relayer.ts
```

**generate-dev-key.ts**: Generates development key pairs
```bash
npx ts-node scripts/generate-dev-key.ts
```

### Testing

**integration-sim.ts**: Runs end-to-end integration tests
```bash
export RELAYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
export USER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
npx ts-node scripts/integration-sim.ts
```

## Network Verification

Verify network connectivity:

```bash
# Check credchainus subnet
curl -X POST --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc
```

Expected response: `{"jsonrpc":"2.0","id":1,"result":"0x146289"}`

## Configuration Files

**endpoints.json**: Network endpoint configuration
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

**teleporter.json**: ICM Teleporter contract addresses
```json
{
  "credchainus": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
}
```

## Development Accounts

**Main Account (ewoq)**:
- Address: `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC`
- Private Key: `0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`
- Pre-funded with ~1,000,000 USCred tokens

**ICM Account**:
- Address: `0x58155273dfCe2e0D931cb38db80123678229c07B`
- Private Key: `0xa7c558e3236ec52ce0ef78005c6f977f566861c64194df9b0ce9916fa85251b0`
- Pre-funded with 600 USCred tokens

## Wallet Configuration

Add the credchainus network to MetaMask or Core Wallet:

- **Network Name**: credchainus
- **RPC URL**: `http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc`
- **Chain ID**: `1337001`
- **Currency Symbol**: `USCred`
- **Currency Name**: `USCred Token`

## Security Considerations

- Never commit private keys to version control
- Use environment variables for sensitive configuration
- Rotate development keys regularly
- Implement proper access controls for production deployments

## Troubleshooting

**Network Connection Issues**:
- Verify subnet is running with `avalanche network status`
- Check RPC endpoint accessibility
- Ensure correct chain ID configuration

**Account Funding Issues**:
- Verify account has sufficient balance
- Check gas price configuration
- Ensure proper private key format (0x prefix)

**Contract Deployment Issues**:
- Verify Teleporter contracts are deployed first
- Check network configuration in endpoints.json
- Ensure sufficient gas limits
- Chain ID: `1337002` (decimal)
- Currency symbol: `EUCred`
- Block explorer URL: (none for local)

**CredChain IN (Local)**  
- Network name: `CredChain IN (local)`  
- RPC URL: `http://127.0.0.1:9654/ext/bc/C/rpc`  
- Chain ID: `1337003` (decimal)  
- Currency symbol: `INCred`  
- Block explorer URL: (none for local)

## Pre-funded Test Accounts

Your subnets come with pre-funded accounts you can import:

**Main Account (ewoq)**
- Address: `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC`
- Private Key: `0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`
- Balance: 1,000,000 tokens on each subnet

**ICM Account** 
- Address: `0x58155273dfCe2e0D931cb38db80123678229c07B`  
- Private Key: `0xa7c558e3236ec52ce0ef78005c6f977f566861c64194df9b0ce9916fa85251b0`
- Balance: 600 tokens on each subnet

## Key management & safety

⚠️ **These are development keys only** - never use in production!

- The keys shown above are from Avalanche CLI test defaults and are safe to use for local development
- For production or public networks, generate new keys: `avalanche key create <keyname>`
- Never commit real private keys to git
- Use environment variables for all keys in scripts

## Managing Your Local Network

**Start/Stop Network:**
```bash
# Start network (if stopped)
avalanche network start

# Stop network  
avalanche network stop

# Check status
avalanche network status
```

**Restart with Clean State:**
```bash
avalanche network stop
avalanche network clean
# Then re-run deployment scripts
```

**Subnet Management:**
```bash
# List your subnets
avalanche blockchain list

# Describe a specific subnet
avalanche blockchain describe credchainus
avalanche blockchain describe credchaineu
```

## Files and artifacts

- `infra/endpoints.json` — RPC endpoints and chain configuration (create this if missing):
  ```json
  {
    "us": { "chainId": "1337001", "subnetId": "credchainus", "rpc": "http://127.0.0.1:9650/ext/bc/C/rpc", "teleporterAddr": null },
    "eu": { "chainId": "1337002", "subnetId": "credchaineu", "rpc": "http://127.0.0.1:9652/ext/bc/C/rpc", "teleporterAddr": null }
  }
  ```
- `infra/teleporter.json` — teleporter contract addresses (generated by deploy scripts)
- `onchain/artifacts/{us,eu}.json` — deployment artifacts with all contract addresses
- `shared/onchain-artifacts/` — consolidated artifacts for frontend consumption

## Troubleshooting

**"avalanche: command not found"**: Already fixed - your CLI is working!

**RPC connection errors**: 
- Ensure network is running: `avalanche network status`
- Use correct path: `/ext/bc/C/rpc` (not just the port)
- Check firewall isn't blocking ports 9650, 9652

**Deployment failures**:
- Check account has funds: `curl -X POST http://127.0.0.1:9650/ext/bc/C/rpc -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC","latest"]}'`
- Verify private key format: must start with `0x`

**Integration simulation issues**:
- Ensure contracts are deployed first
- Check `shared/onchain-artifacts/addresses.json` exists
- Verify all environment variables are set

## Next Steps

Now that your infrastructure is ready:

1. **✅ Deploy contracts**: Run the deployment commands above
2. **Build frontend**: Start Module 3 (React/Next.js application)  
3. **Test end-to-end flow**: Use the integration simulation
4. **Add more verifiers**: Deploy additional VerificationAttestor instances
5. **Add compliance features**: Implement jurisdiction-specific validation

## Available Scripts Reference

- `infra/scripts/subnet-control.ts` — start/stop/status subnet management
- `infra/scripts/deploy-teleporter.ts` — deploy mock teleporter only  
- `infra/scripts/fund-relayer.ts` — transfer funds between accounts
- `infra/scripts/generate-dev-key.ts` — create new dev key pairs
- `infra/scripts/integration-sim.ts` — end-to-end workflow test
- `onchain/scripts/deploy-multi.ts` — deploy all contracts to both subnets
- `onchain/scripts/export-artifacts.ts` — prepare artifacts for frontend
- `onchain/scripts/generate-shared-artifacts.ts` — create consolidated artifact files

## Frontend consumption & serving artifacts

1. infra/endpoints.json contains network keys, RPC URLs and teleporterAddr — frontend/SDK expects these values via module3-api.

2. shared/onchain-artifacts should be copied / served by module3-api:
- Export from onchain:
  cd onchain
  npx ts-node scripts/export-artifacts.ts
  npx ts-node scripts/generate-shared-artifacts.ts

3. If module3-api runs on the same machine it will read shared/onchain-artifacts and serve:
- GET /v1/networks -> derived from infra/endpoints.json
- GET /v1/artifacts/addresses -> consolidated addresses.json
- GET /v1/artifacts/:network/abis -> per-contract ABIs

4. Teleporter / ICM addresses:
- infra/teleporter.json and infra/endpoints.json contain teleporter addresses. These are used by frontend to display routing info and for debugging cross-chain flows.

Example: make sure module3-api sees shared artifacts before starting:
```
cd onchain
npx ts-node scripts/export-artifacts.ts
npx ts-node scripts/generate-shared-artifacts.ts
cd ../module3-api
MODULE3_API_KEY=devkey npm run dev
```
MODULE3_API_KEY=devkey npm run dev
```
