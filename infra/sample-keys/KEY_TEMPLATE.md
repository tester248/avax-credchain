Local Dev Key Template (DO NOT COMMIT PRIVATE KEYS)

This file explains how to generate and use local dev keys for the infra module.

Steps (dev only):
1. Generate a key locally using `node` or `npx ts-node scripts/generate-dev-key.ts`.
2. Use the printed private key for local development only.
3. Never commit the private key to git. For production, use a secrets manager.

Example (dev only):
```bash
# generate an ephemeral key
npx ts-node scripts/generate-dev-key.ts

# set as env var for scripts
export RELAYER_PRIVATE_KEY="0x..."
```
