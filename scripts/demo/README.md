Demo scripts
============

This directory contains two helper scripts to start a lightweight local demo for Module 3.

Files:

- `start.sh` — launches a Hardhat node, the `module3-api` dev server, and the `module3-ui` Next.js dev server. Writes pid files and logs to `scripts/demo/logs`.
- `stop.sh` — stops processes started by `start.sh` using pid files.

Usage:

1. From the repository root, make scripts executable once:

```bash
chmod +x scripts/demo/*.sh
```

2. Start the demo (this will run Hardhat, module3-api, and module3-ui):

```bash
scripts/demo/start.sh
```

3. Stop the demo:

```bash
scripts/demo/stop.sh
```

Notes:
- Ensure you have dependencies installed for `onchain`, `module3-api`, and `module3-ui`.
- `module3-api` runs with `npm run dev` (ts-node-dev) for quick iteration. Adjust `start.sh` if you prefer to run built artifacts.
- `start.sh` is intentionally simple for local development and not meant for production orchestration.
