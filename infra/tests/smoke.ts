import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'

/**
 * infra/tests/smoke.ts
 *
 * - Verifies the RPC endpoints from `infra/endpoints.json` are reachable
 * - If `infra/teleporter.json` contains addresses, attempts to call `name()` or
 *   any read-only function to validate the contract is present and ABI-compatible.
 *
 * Usage:
 *  npx ts-node infra/tests/smoke.ts
 */

const repoRoot = path.resolve(__dirname, '..')
const endpointsPath = path.join(repoRoot, 'endpoints.json')
const teleporterPath = path.join(repoRoot, 'teleporter.json')

async function checkRpc(rpc: string) {
  try {
    const provider = new ethers.JsonRpcProvider(rpc)
    const chainId = await provider.send('eth_chainId', [])
    console.log(`RPC ${rpc} responded chainId=${chainId}`)
    return true
  } catch (e: any) {
    console.error(`RPC ${rpc} failed: ${e.message || e}`)
    return false
  }
}

async function checkTeleporter(rpc: string, addr: string) {
  try {
    // Minimal ABI with a sample public/read function; MockTeleporter.sol emits MessageSent
    const abi = [
      'function version() view returns (string)',
      'function owner() view returns (address)'
    ]
    const provider = new ethers.JsonRpcProvider(rpc)
    const contract = new ethers.Contract(addr, abi, provider)
    // Try owner() first; if function missing ABI call will throw
    const owner = await contract.owner()
    console.log(`Teleporter @ ${addr} owner=${owner}`)
    return true
  } catch (e: any) {
    console.warn(`Teleporter check failed for ${addr} on ${rpc}: ${e.message || e}`)
    return false
  }
}

async function main() {
  if (!fs.existsSync(endpointsPath)) {
    console.error('endpoints.json not found; run infra/scripts/deploy-subnets.ts first')
    process.exit(2)
  }

  const endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'))
  let allGood = true

  for (const key of Object.keys(endpoints)) {
    const e = endpoints[key]
    console.log(`Checking ${key} -> ${e.rpc}`)
    const ok = await checkRpc(e.rpc)
    allGood = allGood && ok
  }

  if (fs.existsSync(teleporterPath)) {
    const tele = JSON.parse(fs.readFileSync(teleporterPath, 'utf8'))
    for (const key of Object.keys(tele)) {
      const addr = tele[key]
      const rpc = endpoints[key]?.rpc
      if (!rpc) {
        console.warn(`No RPC for ${key}, skipping teleporter check`)
        allGood = false
        continue
      }
      if (!addr) {
        console.warn(`No teleporter address for ${key}`)
        allGood = false
        continue
      }
      const ok = await checkTeleporter(rpc, addr)
      allGood = allGood && ok
    }
  } else {
    console.warn('teleporter.json not found; skipping teleporter checks')
  }

  if (!allGood) process.exit(3)
  console.log('Infra smoke tests passed')
}

main().catch((e) => {
  console.error('Smoke test failed', e)
  process.exit(1)
})
