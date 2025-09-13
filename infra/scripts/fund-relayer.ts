#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { ethers } from 'ethers'

const repoRoot = path.resolve(__dirname, '..')
const endpointsPath = path.join(repoRoot, 'endpoints.json')

async function main() {
  if (!fs.existsSync(endpointsPath)) throw new Error('endpoints.json not found')
  const endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'))
  const cchainRpc = endpoints.us.rpc // assume using US C-Chain for funding

  const provider = new ethers.JsonRpcProvider(cchainRpc as any)

  // Dev-funded key (from local genesis). WARNING: this key is for local dev only.
  const FUNDER_PRIVATE_KEY = process.env.FUNDER_PRIVATE_KEY
  const RELAYER_ADDR = process.env.RELAYER_ADDRESS

  if (!FUNDER_PRIVATE_KEY) throw new Error('Set FUNDER_PRIVATE_KEY env var')
  if (!RELAYER_ADDR) throw new Error('Set RELAYER_ADDRESS env var')

  const funder = new ethers.Wallet(FUNDER_PRIVATE_KEY as any, provider)

  console.log(`Funder address: ${funder.address}`)
  const balance = await provider.getBalance(funder.address)
  console.log(`Funder balance: ${ethers.formatEther(balance)} AVAX`)

  const amount = process.env.FUND_AMOUNT || '1.0' // 1 AVAX by default
  console.log(`Sending ${amount} AVAX to ${RELAYER_ADDR}`)

  const tx = await funder.sendTransaction({ to: RELAYER_ADDR as any, value: ethers.parseEther(amount) })
  console.log('Tx sent:', tx.hash)
  await tx.wait()
  console.log('Tx mined')

  const newBal = await provider.getBalance(RELAYER_ADDR as any)
  console.log(`Relayer new balance: ${ethers.formatEther(newBal)} AVAX`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
