#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

/**
 * deploy-subnets.ts (improved)
 *
 * - Creates two local Subnet-EVM blockchains (credchainus, credchaineu) using the
 *   Avalanche CLI in non-interactive mode.
 * - Starts the local network.
 * - Writes `infra/endpoints.json` with chain IDs and C-Chain RPC endpoints.
 *
 * Environment variables:
 * - OWNER_ADDR: EVM address to set as validator-manager-owner. If not provided,
 *   the script will attempt to pick the first stored key from `avalanche key list`.
 * - USE_GENESIS=true: if set, the script will use the local `subnets/../genesis.json`
 *   files with `--genesis` when creating blockchains. Otherwise it uses `--evm`.
 */

const repoRoot = path.resolve(__dirname, '..')
const endpointsPath = path.join(repoRoot, 'endpoints.json')

function runCmd(cmd: string) {
  try {
    console.log(`> ${cmd}`)
    return execSync(cmd, { encoding: 'utf8' })
  } catch (err: any) {
    console.error(`Command failed: ${cmd}`)
    if (err.stdout) console.error(err.stdout.toString())
    if (err.stderr) console.error(err.stderr.toString())
    throw err
  }
}

function writeEndpoints(obj: any) {
  fs.writeFileSync(endpointsPath, JSON.stringify(obj, null, 2))
  console.log(`Wrote endpoints to ${endpointsPath}`)
}

function detectOwnerFromKeyList(): string | null {
  try {
    const out = runCmd('avalanche key list')
    // crude parse: find first hex address like 0x...
    const m = out.match(/0x[0-9a-fA-F]{40}/)
    return m ? m[0] : null
  } catch (e) {
    return null
  }
}

async function main() {
  console.log('deploy-subnets: starting')

  // Ensure avalanche CLI exists
  try {
    runCmd('command -v avalanche')
  } catch (_) {
    console.warn('avalanche CLI not found; aborting')
    return
  }

  const owner = process.env.OWNER_ADDR || detectOwnerFromKeyList()
  if (!owner) {
    throw new Error('No OWNER_ADDR found in env and no local avalanche key detected')
  }

  const useGenesis = !!process.env.USE_GENESIS

  // Create blockchains
  try {
    if (useGenesis) {
      runCmd(`avalanche blockchain create credchainus --genesis subnets/us/genesis.json --proof-of-authority --validator-manager-owner ${owner} --force`)
      runCmd(`avalanche blockchain create credchaineu --genesis subnets/eu/genesis.json --proof-of-authority --validator-manager-owner ${owner} --force`)
    } else {
      runCmd(`avalanche blockchain create credchainus --evm --evm-chain-id 1337001 --evm-token USCred --proof-of-authority --validator-manager-owner ${owner} --test-defaults --force`)
      runCmd(`avalanche blockchain create credchaineu --evm --evm-chain-id 1337002 --evm-token EUCred --proof-of-authority --validator-manager-owner ${owner} --test-defaults --force`)
    }
  } catch (e) {
    console.warn('Some create commands failed; continuing (they may already exist)')
  }

  // Start the network (safe to try; will fail if already running)
  try {
    runCmd('avalanche network start')
  } catch (e) {
    console.warn('avalanche network start failed (network may already be running)')
  }

  // Write endpoints (local dev convention)
  const endpoints: any = {
    us: { chainId: '1337001', subnetId: 'credchainus', rpc: 'http://127.0.0.1:9650/ext/bc/C/rpc', teleporterAddr: null },
    eu: { chainId: '1337002', subnetId: 'credchaineu', rpc: 'http://127.0.0.1:9652/ext/bc/C/rpc', teleporterAddr: null }
  }

  writeEndpoints(endpoints)
}

main().catch((err) => {
  console.error('deploy-subnets failed', err)
  process.exit(1)
})
