# Handling Validator Keys (Dev vs Production)

This file explains how to manage validator keys for local development and production.

Local dev

- Use the keys in `sample-keys/` only for local testing. They are not secure and should be regenerated.
- Do NOT commit real private keys to the repo.

Production / Shared infra

- Store private keys in a secure secrets manager (AWS KMS/Secrets Manager, HashiCorp Vault) and inject into CI/CD or node startup via environment variables or mounted files with strict permissions.
- Use `AVALANCHE_VALIDATOR_KEY` or similar env vars when invoking deployment scripts.

Sample usage (production should replace with a secret injection method):

```bash
export AVALANCHE_VALIDATOR_KEY="<hex-private-key>"
node deploy-scripts/deploy-subnet.js
```
