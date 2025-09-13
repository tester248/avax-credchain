# CredentialChain — Infra Module (Local dev)

Purpose: provide subnet templates, local deploy scripts, and Teleporter mock deployment for local development. This runbook explains installing the Avalanche CLI, starting/test-driving local subnets, deploying the mock Teleporter, and safety notes for handling dev keys.

## Quick start

1. Install Node dependencies (from `infra/`):

```bash
cd infra
npm install
```

2. Install the Avalanche CLI (avalanche):

- macOS / Linux (recommended via the official install script):

```bash
# download and install avalanche CLI to ~/.local/bin (or /usr/local/bin)
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | bash
# ensure it's on your PATH; you may need to add ~/.local/bin to PATH
export PATH="$HOME/.local/bin:$PATH"
```

- Alternatively build from source or use system packages per the Avalanche docs.

3. Create and start local subnets (non-interactive):

```bash
# Option A: use repo genesis files (if you customized them)
USE_GENESIS=true OWNER_ADDR=0xYourOwnerAddress node infra/scripts/deploy-subnets.ts

# Option B: let the script create EVM subnets with sensible defaults
OWNER_ADDR=0xYourOwnerAddress node infra/scripts/deploy-subnets.ts
```

Notes:
- `OWNER_ADDR` should be an address present in your local `avalanche` key store (e.g. created via `avalanche key create`). If you omit it the script will try to detect the first address from `avalanche key list`.
- The script will attempt to run `avalanche network start` (safe to run even when a network is active).

4. Confirm RPCs are reachable:

```bash
# US C-Chain
curl -sS -X POST http://127.0.0.1:9650/ext/bc/C/rpc -H 'content-type:application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'

# EU C-Chain (if present)
curl -sS -X POST http://127.0.0.1:9652/ext/bc/C/rpc -H 'content-type:application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

Expected responses include valid chain IDs like `0x1453...` (depends on subnet creation). Our local convention in this repo uses chain IDs `1337001` (US) and `1337002` (EU) expressed as decimal in `infra/endpoints.json`.

## Deploy the Mock Teleporter (contract)

We provide `infra/scripts/deploy-teleporter.ts` to compile and deploy the `MockTeleporter.sol` contract to each C-Chain.

1. Ensure you have a funded relayer private key. In local dev you can use the genesis-funded dev key and then transfer AVAX to the relayer address. Example sequence:

```bash
# generate a dev key (prints address and private key)
node infra/scripts/generate-dev-key.ts

# fund relayer (example: use ts-node or npx ts-node if you don't have ts-node global)
RELAYER_ADDRESS=0xRelayerAddr FUNDER_PRIVATE_KEY=0xYourFundedKey npx ts-node infra/scripts/fund-relayer.ts

# deploy teleporter using the relayer private key
RELAYER_PRIVATE_KEY=0xYourRelayerPrivateKey npx ts-node infra/scripts/deploy-teleporter.ts
```

2. After successful deploy, `infra/teleporter.json` will be updated with the teleporter contract addresses per subnet.

## Adding RPCs to MetaMask / Core Wallet

- Add a new network in MetaMask with the following fields (example for US C-Chain):
  - Network name: `CredChain US (local)`
  - RPC URL: `http://127.0.0.1:9650/ext/bc/C/rpc`
  - Chain ID: `1337001` (decimal)
  - Currency symbol: `AVAX`
  - Block explorer URL: (none for local)

- Repeat for EU with port `9652` and chain ID `1337002`.

## Key management & safety

- Never commit real private keys. The `infra/sample-keys/KEY_TEMPLATE.md` contains examples and guidance. Use environment variables for secrets and add them to your local `.env` (never commit `.env`).

- Recommended env variables when running scripts:
  - `RELAYER_PRIVATE_KEY` — private key of the account that will deploy contracts and submit messages.
  - `FUNDER_PRIVATE_KEY` — private key of a funded account used to top up the relayer.
  - `OWNER_ADDR` — used by `deploy-subnets.ts` to set the validator-manager-owner when creating the subnets.

- If using the repository in CI, prefer ephemeral test accounts created at runtime and stored securely in CI secrets.

## Troubleshooting

- "avalanche: command not found": ensure `~/.local/bin` or installation path is on your `PATH` and restart your shell.
- RPC 404 or empty reply: ensure you are using the C-Chain RPC path: `/ext/bc/C/rpc` (not the base node port).
- Insufficient funds when deploying: fund the relayer with `infra/scripts/fund-relayer.ts`.

## Files and artifacts

- `infra/endpoints.json` — written by `deploy-subnets.ts` with keys `us` and `eu`:
  - `{ chainId, subnetId, rpc, teleporterAddr }
- `infra/teleporter.json` — teleporter addresses written after deploy
- `infra/subnets/*/genesis.json` — optional genesis files used when `USE_GENESIS=true`

## Next steps (suggested)

- Add a smoke test that verifies both RPC endpoints and the Teleporter contract are reachable. See `infra/tests` for planned tests.

---

If you'd like, I can (next) create `infra/tests/smoke.ts` and a GitHub Actions workflow to run it on PRs.
