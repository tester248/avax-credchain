Infra manual testing and smoke steps

Prereqs:
- Node >= 18, npm, ts-node
- avalanche-cli / avalanchego for local subnet testing (optional for full infra)

Quick local smoke (uses pre-generated artifacts under `shared/onchain-artifacts`):

1. Ensure `infra/endpoints.json` exists and points to running C-Chain RPCs (local dev).

2. Ensure `shared/onchain-artifacts/addresses.json` and `shared/onchain-artifacts/abis` exist. Generate them from `onchain` if needed:

```bash
cd onchain
npx ts-node scripts/generate-shared-artifacts.ts
```

3. Set env keys (dev only). You can create temporary keys for testing:

```bash
export RELAYER_PRIVATE_KEY=0x...   # funded account
export USER_PRIVATE_KEY=0x...      # user account
export DEPLOYER_PRIVATE_KEY=0x...  # optional for onchain deploy
```

4. Run integration simulation (this will execute `infra/scripts/relayer.ts`):

```bash
cd /workspaces/avax-credchain
npx ts-node infra/scripts/integration-sim.ts
```

Managing local subnet nodes
--------------------------

We provide a small helper script to manage local subnet nodes: `infra/scripts/subnet-control.ts`.

Usage (from repo root):

```bash
# start subnets (uses `avalanche network start` if `avalanche` is on PATH)
npx ts-node infra/scripts/subnet-control.ts start

# stop subnets (tries `avalanche network stop`, otherwise kills processes on known ports)
npx ts-node infra/scripts/subnet-control.ts stop

# restart
npx ts-node infra/scripts/subnet-control.ts restart

# quick status check of endpoints in infra/endpoints.json
npx ts-node infra/scripts/subnet-control.ts status
```

Notes:
- Prefer using the `avalanche` CLI commands (`avalanche network start/stop`) which cleanly start/stop the node containers and processes.
- The fallback `stop` uses `lsof` to find processes listening on common C-Chain RPC ports (9650, 9651, 9652) and kills them; this is a last-resort option and may be unsafe for production.
- If you get `command not found` for `avalanche`, follow the install instructions earlier in this README:

```bash
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | bash
```


What the simulation does:
- Relayer verifies a simulated user's signed request (simple EIP-191 style)
- Relayer submits a sponsored transaction calling `CrossChainRouter.requestVerification`

If you need to run from scratch (create subnets, deploy teleporter, deploy contracts):

1. Start or create subnets using `infra/scripts/deploy-subnets.ts` (see script docs).
2. Deploy MockTeleporter to each C-Chain RPC: `npx ts-node infra/scripts/deploy-teleporter.ts` (set `RELAYER_PRIVATE_KEY`).
3. Deploy onchain contracts to each network: `npx ts-node onchain/scripts/deploy-multi.ts` (set `DEPLOYER_PRIVATE_KEY`).
4. Export artifacts: `npx ts-node onchain/scripts/export-artifacts.ts` and then `npx ts-node onchain/scripts/generate-shared-artifacts.ts`.

Notes and caveats:
- These scripts are for local development only and are NOT secure for production.
- Make sure your relayer account is funded on target RPCs (use `infra/scripts/fund-relayer.ts`).
- If RPC endpoints return 404, ensure you use the C-Chain RPC path: `/ext/bc/C/rpc`.
