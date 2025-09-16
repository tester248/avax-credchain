#!/usr/bin/env node
// Simple Avalanche C-Chain/subnet query CLI
// Usage: node scripts/avax-query.js <rpcUrl> <method> [params...]

const [,, rpcUrl, method, ...params] = process.argv;
if (!rpcUrl || !method) {
  console.error('Usage: node scripts/avax-query.js <rpcUrl> <method> [params...]');
  process.exit(1);
}

async function main() {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method,
    params: params.map(p => {
      try { return JSON.parse(p); } catch { return p; }
    })
  };
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.error) {
    console.error('Error:', data.error);
    process.exit(2);
  }
  console.log(JSON.stringify(data.result, null, 2));
}

main();
