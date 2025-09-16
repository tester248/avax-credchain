# Demo Scripts

Helper scripts for starting and managing a local demonstration environment of the CredChain system.

## Overview

This directory contains automation scripts to launch all components of the CredChain system for local development and demonstration purposes.

## Files

- **start.sh** - Launches the complete demo environment including blockchain node, API server, and frontend
- **stop.sh** - Gracefully stops all demo processes using PID files
- **logs/** - Directory containing log files from running services

## Prerequisites

Ensure all module dependencies are installed:

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

## Usage

### Starting the Demo

From the repository root directory:

```bash
# Make scripts executable (first time only)
chmod +x scripts/demo/*.sh

# Start the complete demo environment
scripts/demo/start.sh
```

This will start:
- Hardhat local blockchain node
- Module3 API server on port 4000
- Module3 UI frontend on port 3000

### Stopping the Demo

```bash
scripts/demo/stop.sh
```

This will gracefully stop all processes and clean up PID files.

## Services Started

The demo environment includes:

1. **Hardhat Node** - Local blockchain for testing
   - Port: 8545
   - Chain ID: 31337
   - Pre-funded accounts available

2. **Module3 API** - Backend API service
   - Port: 4000
   - Endpoints: /api/* and /v1/*
   - Logs: scripts/demo/logs/module3-api.log

3. **Module3 UI** - Frontend web interface
   - Port: 3000
   - Next.js development server
   - Logs: scripts/demo/logs/module3-ui.log

## Process Management

The scripts use PID files for process tracking:
- `hardhat.pid` - Hardhat node process
- `module3-api.pid` - API server process
- `module3-ui.pid` - Frontend server process

## Logging

All service logs are written to the `logs/` directory for debugging and monitoring.

## Development Notes

- The API server runs with `ts-node-dev` for hot reloading during development
- Frontend runs with Next.js development server for fast refresh
- Modify scripts as needed for different development workflows
- Not intended for production deployment

## Troubleshooting

**Scripts Won't Execute**:
- Ensure scripts are executable: `chmod +x scripts/demo/*.sh`
- Verify you're running from the repository root

**Services Won't Start**:
- Check that required ports are available
- Verify all dependencies are installed
- Review log files in `logs/` directory

**Processes Don't Stop**:
- Manually kill processes if PID files are corrupted
- Remove stale PID files and restart
