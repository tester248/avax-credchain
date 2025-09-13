Subnet templates for CredentialChain infra

This folder contains example subnet genesis templates for each jurisdiction. These are starter files with clearly marked placeholders. Update values before deploying.

Structure
- `us/` - US subnet genesis + metadata
- `eu/` - EU subnet genesis + metadata

Instructions
1. Edit `genesis.json` in the jurisdiction folder to set chainId, token names, and validator keys (use `sample-keys/` for dev).
2. Use `avalanche-cli` or `@avalanche-sdk` to create and deploy the subnet according to your environment.
