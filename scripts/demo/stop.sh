#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEMO_DIR="$ROOT/scripts/demo"

function stop_pidfile() {
  local f="$1"
  if [ -f "$f" ]; then
    local pid; pid=$(cat "$f")
    if ps -p "$pid" > /dev/null 2>&1; then
      echo "Killing PID $pid (from $f)"
      kill "$pid" || true
      sleep 1
      if ps -p "$pid" > /dev/null 2>&1; then
        echo "PID $pid still running; killing -9"
        kill -9 "$pid" || true
      fi
    else
      echo "PID $pid not running"
    fi
    rm -f "$f"
  fi
}

stop_pidfile "$DEMO_DIR/hardhat.pid"
stop_pidfile "$DEMO_DIR/module3-api.pid"
stop_pidfile "$DEMO_DIR/module3-ui.pid"

echo "Stopped demo services. Logs remain in $DEMO_DIR/logs"
