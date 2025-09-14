#!/usr/bin/env bash
set -euo pipefail

# Simple demo starter: launches hardhat node, module3-api (dev), and module3-ui (dev).
# Writes PID files and logs to this directory.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEMO_DIR="$ROOT/scripts/demo"
mkdir -p "$DEMO_DIR/logs"

cd "$ROOT/onchain"
echo "Starting Hardhat node..."
nohup npx hardhat node > "$DEMO_DIR/logs/hardhat.log" 2>&1 &
echo $! > "$DEMO_DIR/hardhat.pid"
echo "Hardhat node PID $(cat $DEMO_DIR/hardhat.pid)"; sleep 1

echo "Starting module3-api (ts-node-dev) with repo root as cwd so shared artifacts are visible..."
# Run ts-node-dev from repo root but point to module3-api/src/index.ts so process.cwd() is repo root
nohup bash -lc "cd '$ROOT' && npx ts-node-dev --respawn --transpile-only module3-api/src/index.ts" > "$DEMO_DIR/logs/module3-api.log" 2>&1 &
echo $! > "$DEMO_DIR/module3-api.pid"
echo "module3-api PID $(cat $DEMO_DIR/module3-api.pid)"; sleep 1

cd "$ROOT/module3-ui"
echo "Starting module3-ui (next dev)..."
nohup npm run dev > "$DEMO_DIR/logs/module3-ui.log" 2>&1 &
echo $! > "$DEMO_DIR/module3-ui.pid"
echo "module3-ui PID $(cat $DEMO_DIR/module3-ui.pid)"; sleep 1

echo "Demo started. Logs in $DEMO_DIR/logs"
echo "To stop: $DEMO_DIR/stop.sh"
