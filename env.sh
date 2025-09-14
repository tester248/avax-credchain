#!/usr/bin/env bash
# env.sh - sample environment exports for local development
#
# Usage:
#   - Do NOT commit real secrets. This file contains placeholders.
#   - Copy this file to a secure location or set real values from your CI/secret manager.
#   - To use in your shell for development:
#       source ./env.sh
#
# Security note: prefer using a secrets manager, `.env.local` (gitignored), direnv, or
# CI environment variables for real credentials. Never commit private keys or secrets.

#############################
# Avalanche / Infra
#############################
# Avalanche CLI (AvaCloud) API key (optional)
export AVALANCHE_CLI_API_KEY="" # e.g. "sk-..." (leave empty for local-only workflows)

# Path to infra endpoints produced by Module 1 (infra/endpoints.json)
export INFRA_ENDPOINTS_PATH="./infra/endpoints.json"

# Teleporter messenger contract addresses (filled by infra deploy)
export TELEPORTER_MESSENGER_ADDR_US="0xEe3a2fB940Fc623Dc7713bB37aa7D5484a99072F"   # e.g. 0x...
export TELEPORTER_MESSENGER_ADDR_EU="0xBbE98ee5451c9353e141638C97f3c4FD9072481C"   # e.g. 0x...

# Subnet RPC endpoints for Avalanche L1 blockchain
export AVALANCHE_L1_RPC="http://127.0.0.1:9650/ext/bc/C/rpc"  # Your Avalanche L1 RPC
export SUBNET_US_RPC="http://127.0.0.1:9650/ext/bc/C/rpc"  # Updated to use Avalanche L1
export SUBNET_EU_RPC="http://127.0.0.1:9650/ext/bc/C/rpc"  # Updated to use Avalanche L1

# Toggle to indicate infra subnets are permissioned (true/false)
export PERMISSIONED_SUBNET="true"

# Optional: enable Teleporter mock for local dev if real Teleporter not deployed
export TELEPORTER_MOCK="true"

#############################
# Relayer / Keys
#############################
# Primary relayer key used to sponsor transactions in a permissioned subnet.
# IMPORTANT: Never commit the private key. Use a secrets manager in production.
export RELAYER_PRIVATE_KEY="0x6d86dc179c30a6e8c0d2520d6534cfb9f8bd9216122d1967157d56034aebc55a"  # e.g. 0xabc123... (leave empty)
export RELAYER_ADDRESS="0x8CfbBa288e11a8146Bd3bB73eDcB510000FD3072"      # e.g. 0xabc123... (derived from private key)

# User key for testing (using ewoq test account)
export USER_PRIVATE_KEY="0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"

#############################
# Encryption / EERC
#############################
# Enable EERC (Encrypted EVM Runtime Compiler) integration or client-side encryption
export EERC_ENABLED="false"  # set "true" if you've enabled EERC for the subnet

#############################
# Off-chain storage / Vault (Module 3)
#############################
# Pinata (IPFS pinning) credentials (or use S3 below)
export PINATA_API_KEY=""
export PINATA_API_SECRET=""

# AWS S3 credentials (optional vault/storage)
export AWS_S3_BUCKET=""
export AWS_REGION=""
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""

#############################
# On-chain artifact paths / other helpers
#############################
export ONCHAIN_ARTIFACTS_DIR="./onchain/artifacts"
export SHARED_ARTIFACTS_DIR="./shared/onchain-artifacts"

# Optional node environment
export NODE_ENV="development"

#############################
# Helpful functions (optional)
#############################
_env_warn_if_empty() {
  local name="$1";
  if [ -z "${!name}" ]; then
    echo "[env.sh] WARNING: $name is empty"
  fi
}

# Quick sanity checks for common variables (uncomment to run on source)
# _env_warn_if_empty AVALANCHE_CLI_API_KEY
# _env_warn_if_empty RELAYER_PRIVATE_KEY
# _env_warn_if_empty SUBNET_US_RPC
# _env_warn_if_empty SUBNET_EU_RPC

#############################
# End of file
#############################
