# CredentialChain — Infra Module (Local dev)

Purpose: provide subnet templates, local deploy scripts, and Teleporter mock deployment for local development. This runbook explains installing the Avalanche CLI, starting/test-driving local subnets, deploying the mock Teleporter, and safety notes for handling dev keys.

## Current Status ✅

Based on your setup, you already have:
- **Two local subnets running**: `credchainus` (1337001) and `credchaineu` (1337002)
- **Pre-funded accounts**: `ewoq` account with 1M tokens on each subnet
- **Avalanche CLI**: Properly installed and configured
- **All smart contracts**: Successfully compiled and ready for deployment

## Quick start

1. Install Node dependencies (from `infra/`):

```bash
cd infra
npm install
```

2. ✅ **Already done**: Avalanche CLI is installed and working

3. ✅ **Already done**: Local subnets are created and running

4. Verify your setup and RPCs are reachable:

```bash
# Check subnet status
avalanche network status

# Test US C-Chain RPC
curl -sS -X POST http://127.0.0.1:9650/ext/bc/C/rpc -H 'content-type:application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'

# Test EU C-Chain RPC  
curl -sS -X POST http://127.0.0.1:9652/ext/bc/C/rpc -H 'content-type:application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

Expected responses: `{"jsonrpc":"2.0","id":1,"result":"0x146289"}` (US) and `{"jsonrpc":"2.0","id":1,"result":"0x14628a"}` (EU)

## Deploy Smart Contracts

You have all contracts compiled. Now deploy them to your local subnets:

1. **Use the pre-funded ewoq account** (already has 1M tokens on each subnet):

```bash
# Export the ewoq private key for deployment
export DEPLOYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"

# Deploy to both subnets
cd onchain
npx ts-node scripts/deploy-multi.ts
```

This will deploy all contracts (TeleporterMock, CrossChainRouter, IdentityRegistry, VerificationAttestor, ReputationOracle, FeeToken) to both subnets.

2. **Generate shared artifacts** for frontend consumption:

```bash
# Still in onchain/ directory
npx ts-node scripts/export-artifacts.ts
npx ts-node scripts/generate-shared-artifacts.ts
```

3. **Test the deployment** with integration simulation:

```bash
cd ../infra
export RELAYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
export USER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
npx ts-node scripts/integration-sim.ts
```

## Alternative: Deploy Mock Teleporter Separately

If you want to deploy just the Teleporter mock first (before the main contracts):

```bash
cd infra
export RELAYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
npx ts-node scripts/deploy-teleporter.ts
```

This will create `infra/teleporter.json` with teleporter addresses that the main deployment script can use.

## Adding RPCs to MetaMask / Core Wallet

Add these networks to your wallet for testing:

**CredChain US (Local)**
- Network name: `CredChain US (local)`
- RPC URL: `http://127.0.0.1:9650/ext/bc/C/rpc`
- Chain ID: `1337001` (decimal)
- Currency symbol: `USCred`
- Block explorer URL: (none for local)

**CredChain EU (Local)**  
- Network name: `CredChain EU (local)`
- RPC URL: `http://127.0.0.1:9652/ext/bc/C/rpc`
- Chain ID: `1337002` (decimal)
- Currency symbol: `EUCred`
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

Your local development environment is fully functional! 🚀
