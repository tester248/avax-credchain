#!/usr/bin/env ts-node
/**
 Simple integration simulation that:
 - Reads infra endpoints and shared artifacts
 - Calls the relayer script via Node to simulate a user -> relayer -> CrossChainRouter flow

 This script is a convenience wrapper to demonstrate manual steps.
*/
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const ROOT = path.resolve(__dirname, '..', '..');
const relayerScript = path.join(ROOT, 'infra', 'scripts', 'relayer.ts');

function ensure(file: string) {
  if (!fs.existsSync(file)) {
    console.error('missing file:', file);
    process.exit(1);
  }
}

ensure(path.join(ROOT, 'infra', 'endpoints.json'));
ensure(path.join(ROOT, 'shared', 'onchain-artifacts', 'addresses.json'));

console.log('Running relayer simulation. Ensure ENV: RELAYER_PRIVATE_KEY USER_PRIVATE_KEY');
try {
  const out = execSync(`npx ts-node ${relayerScript}`, { stdio: 'inherit' });
  console.log('Relayer script completed.');
} catch (err: any) {
  console.error('Relayer script failed:', err?.message || err);
  process.exit(1);
}
