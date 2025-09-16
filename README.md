# Avalanche CredChain

A blockchain-based credential verification system built on Avalanche L1 subnets, designed for secure cross-chain identity verification and attestation workflows.

## Overview

CredChain is a decentralized credentialing platform that enables organizations to issue, verify, and manage digital credentials across multiple blockchain networks. The system leverages Avalanche's Inter-Chain Messaging (ICM) protocol for cross-chain communication and provides a comprehensive infrastructure for identity verification.

## Architecture

The project consists of several key components:

- **Smart Contracts** (`onchain/`) - Core blockchain logic for identity registry, verification attestation, and cross-chain routing
- **Infrastructure** (`infra/`) - Subnet deployment, network configuration, and ICM setup
- **API Layer** (`module3-api/`) - RESTful API for enterprise integration and relayer services
- **Frontend** (`module3-ui/`) - Web interface for credential management and verification
- **Shared Artifacts** (`shared/`) - Generated contract addresses and ABIs for cross-module integration

## Implementation Details

### Smart Contracts

The core smart contract system includes:

- **IdentityRegistry**: Central registry for identity management and credential storage
- **VerificationAttestor**: Handles credential verification and attestation processes
- **CrossChainRouter**: Manages cross-chain communication via Avalanche ICM
- **ReputationOracle**: Tracks and validates reputation scores across networks
- **FeeToken**: Custom token for transaction fees and incentive mechanisms
- **TeleporterMock**: Development mock for ICM messaging

### Network Configuration

The system is deployed on Avalanche L1 subnet:

- **Chain ID**: 1337001
- **RPC Endpoint**: `http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc`
- **ICM Teleporter**: `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`

### Deployed Contracts

Current contract deployments on credchainus subnet:

- **TeleporterMock**: `0x4Ac1d98D9cEF99EC6546dEd4Bd550b0b287aaD6D`
- **CrossChainRouter**: `0xA4cD3b0Eb6E5Ab5d8CE4065BcCD70040ADAB1F00`
- **IdentityRegistry**: `0xa4DfF80B4a1D748BF28BC4A271eD834689Ea3407`
- **VerificationAttestor**: `0x95CA0a568236fC7413Cd2b794A7da24422c2BBb6`
- **FeeToken**: `0x789a5FDac2b37FCD290fb2924382297A6AE65860`

## Prerequisites

- Node.js (v18 or higher)
- npm package manager
- Avalanche CLI for subnet management
- Git and POSIX-compatible shell

## Installation and Setup

### 1. Environment Configuration

Source the environment variables:

```bash
source ./env.sh
```

Key environment variables:
- `USER_PRIVATE_KEY`: Private key for the funded ewoq account
- `RELAYER_PRIVATE_KEY`: Private key for relayer operations
- `AVALANCHE_L1_RPC`: RPC endpoint for the L1 subnet

### 2. Install Dependencies

Install dependencies for all modules:

```bash
# Install infrastructure dependencies
cd infra && npm install

# Install smart contract dependencies
cd ../onchain && npm install

# Install API dependencies
cd ../module3-api && npm install

# Install frontend dependencies
cd ../module3-ui && npm install
```

### 3. Verify Network Connection

Test connectivity to the credchainus subnet:

```bash
curl -X POST --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc
```

Expected response: `{"jsonrpc":"2.0","id":1,"result":"0x146289"}`

### 4. Contract Deployment

Deploy contracts to the subnet (if not already deployed):

```bash
cd onchain
npx hardhat run scripts/deploy.ts --network credchainus
```

### 5. Generate Shared Artifacts

Export contract addresses and ABIs for frontend integration:

```bash
cd onchain
npx ts-node scripts/export-artifacts.ts
npx ts-node scripts/generate-shared-artifacts.ts
```

This creates:
- `shared/onchain-artifacts/addresses.json` - Contract addresses by network
- `shared/onchain-artifacts/abis/` - Contract ABIs for frontend integration

## Running the Application

### Start the API Server

```bash
cd module3-api
npm run dev
```

The API server will be available at `http://localhost:4000`

### Start the Frontend

```bash
cd module3-ui
npm run dev
```

The web interface will be available at `http://localhost:3000`

## API Endpoints

The module3-api provides several key endpoints:

- `POST /v1/relayer/submit` - Submit signed verification requests
- `GET /v1/relayer/status/:jobId` - Check relayer job status
- `GET /v1/relayer/list` - List all relayer jobs (development only)
- `POST /api/hr/verification/request` - Request HR verification
- `GET /api/contracts/addresses` - Get deployed contract addresses

## Testing

### Integration Testing

Run the integration simulation to test the complete workflow:

```bash
cd infra
export RELAYER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
export USER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
npx ts-node scripts/integration-sim.ts
```

### Contract Testing

Run smart contract tests:

```bash
cd onchain
npx hardhat test
```

## Development Accounts

The system includes pre-funded development accounts:

**Main Account (ewoq)**:
- Address: `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC`
- Private Key: `0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`
- Balance: ~1,000,000 USCred tokens

**ICM Account**:
- Address: `0x58155273dfCe2e0D931cb38db80123678229c07B`
- Private Key: `0xa7c558e3236ec52ce0ef78005c6f977f566861c64194df9b0ce9916fa85251b0`
- Balance: 600 USCred tokens

## Configuration Files

Key configuration files:

- `infra/endpoints.json` - Network RPC endpoints and chain configurations
- `onchain/hardhat.config.ts` - Hardhat network and deployment settings
- `env.sh` - Environment variables and development settings

## Security Considerations

- Never commit private keys to version control
- Use environment variables for sensitive configuration
- Validate all user inputs in API endpoints
- Implement proper authentication for production deployments
- Consider implementing rate limiting for API endpoints

## Troubleshooting

**Network Connection Issues**:
- Verify the credchainus subnet is running
- Check RPC endpoint connectivity
- Ensure correct chain ID (1337001) is configured

**Deployment Failures**:
- Verify account has sufficient funds for gas
- Check network configuration in hardhat.config.ts
- Ensure all dependencies are installed

**API Connection Issues**:
- Verify API server is running on port 4000
- Check CORS configuration for frontend integration
- Validate environment variables are properly set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.
