#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import solc from 'solc'
import { ethers } from 'ethers'

const repoRoot = path.resolve(__dirname, '..')
const endpointsPath = path.join(repoRoot, 'endpoints.json')
const teleporterPath = path.join(repoRoot, 'teleporter.json')

function compileContract(solPath: string) {
  const source = fs.readFileSync(solPath, 'utf8')
  const input = {
    language: 'Solidity',
    sources: { 'MockTeleporter.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
  }
  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  const contract = output.contracts['MockTeleporter.sol']['MockTeleporter']
  return { abi: contract.abi, bytecode: contract.evm.bytecode.object }
}

async function deployToRpc(rpc: string, abi: any, bytecode: string, privateKey?: string) {
  try {
    const provider = new ethers.JsonRpcProvider(rpc as any)
    // Use provided privateKey or a random wallet for dev
    const wallet = privateKey ? new ethers.Wallet(privateKey as any, provider) : ethers.Wallet.createRandom().connect(provider)
    const factory = new ethers.ContractFactory(abi, bytecode, wallet as any)
    const contract = await factory.deploy()
    await contract.waitForDeployment()
    return contract.target
  } catch (err) {
    console.warn(`Failed to deploy to ${rpc}: ${err}`)
    return null
  }
}

async function main() {
  if (!fs.existsSync(endpointsPath)) throw new Error('endpoints.json not found')
  const endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'))

  const solPath = path.join(repoRoot, 'contracts', 'MockTeleporter.sol')
  const { abi, bytecode } = compileContract(solPath)

  const result: any = {}

  const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY

  for (const key of Object.keys(endpoints)) {
    const rpc = endpoints[key].rpc
    console.log(`Deploying MockTeleporter to ${key} at ${rpc}`)
    const addr = await deployToRpc(rpc, abi, bytecode, RELAYER_PRIVATE_KEY)
    result[key] = addr || '0x0000000000000000000000000000000000000000'
  }

  // Write teleporter.json (legacy file) and patch endpoints.json with teleporterAddr per network
  fs.writeFileSync(teleporterPath, JSON.stringify(result, null, 2))
  console.log(`Wrote teleporter addresses to ${teleporterPath}`)

  // Patch endpoints.json entries to include teleporterAddr where possible
  let changed = false
  for (const k of Object.keys(endpoints)) {
    const addr = result[k]
    if (addr && addr !== '0x0000000000000000000000000000000000000000') {
      if (!endpoints[k].teleporterAddr || endpoints[k].teleporterAddr !== addr) {
        endpoints[k].teleporterAddr = addr
        changed = true
      }
    }
  }
  if (changed) {
    fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2))
    console.log(`Patched ${endpointsPath} with teleporterAddr entries`)
  } else {
    console.log('No changes to endpoints.json required')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
