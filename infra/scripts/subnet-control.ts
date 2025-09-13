#!/usr/bin/env ts-node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * subnet-control.ts
 * - start: runs `avalanche network start` (via avalanche CLI)
 * - stop: runs `avalanche network stop` if available; otherwise kills processes listening on known C-Chain ports
 * - restart: stop then start
 * - status: basic check of RPC reachability for endpoints in infra/endpoints.json
 */

const repoRoot = path.resolve(__dirname, '..')
const endpointsPath = path.join(repoRoot, 'endpoints.json')

function run(cmd: string) {
  console.log('>', cmd)
  return execSync(cmd, { stdio: 'inherit' })
}

function commandExists(cmd: string) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function killOnPort(port: number) {
  try {
    // Linux: use lsof to find process
    const out = execSync(`lsof -i :${port} -t || true`, { encoding: 'utf8' })
    const pids = out.split(/\s+/).filter(Boolean)
    for (const pid of pids) {
      console.log(`Killing PID ${pid} on port ${port}`)
      try { execSync(`kill -9 ${pid}`) } catch (e) { console.warn(`failed to kill ${pid}`) }
    }
  } catch (e) {
    console.warn('killOnPort failed', e)
  }
}

function stopFallback() {
  // Known default C-Chain RPC ports used by our infra
  const ports = [9650, 9652, 9651]
  for (const p of ports) killOnPort(p)
}

function status() {
  if (!fs.existsSync(endpointsPath)) {
    console.log('No endpoints.json found at', endpointsPath)
    return
  }
  const endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'))
  for (const [k, info] of Object.entries<any>(endpoints)) {
    const rpc = info.rpc || info.url
    try {
      console.log(`Checking ${k} -> ${rpc}`)
      run(`curl -sS --max-time 2 ${rpc} -o /dev/null && echo 'OK' || echo 'UNREACHABLE'`)
    } catch (err) {
      const msg = (err && (err as any).message) ? (err as any).message : String(err)
      console.log(`${k} unreachable:`, msg)
    }
  }
}

async function main() {
  const cmd = process.argv[2]
  if (!cmd) {
    console.log('usage: subnet-control.ts <start|stop|restart|status>')
    process.exit(1)
  }

  if (cmd === 'start') {
    if (commandExists('avalanche')) {
      try { run('avalanche network start') } catch (e) { console.warn('avalanche network start failed') }
    } else {
      console.error('avalanche CLI not found on PATH; please install it')
      process.exit(1)
    }
    process.exit(0)
  }

  if (cmd === 'stop') {
    if (commandExists('avalanche')) {
      try { run('avalanche network stop') } catch (e) { console.warn('avalanche network stop failed (maybe network not running)') }
    } else {
      console.warn('avalanche CLI not found; falling back to killing processes on known ports')
      stopFallback()
    }
    process.exit(0)
  }

  if (cmd === 'restart') {
    console.log('Stopping...')
    try { run('node infra/scripts/subnet-control.ts stop') } catch (e) { console.warn('stop fallback failed') }
    console.log('Starting...')
    try { run('node infra/scripts/subnet-control.ts start') } catch (e) { console.warn('start failed') }
    process.exit(0)
  }

  if (cmd === 'status') {
    status()
    process.exit(0)
  }

  console.log('unknown command', cmd)
  process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
