#!/usr/bin/env ts-node
/*
 Simple relayer skeleton for local testing.
 - Verifies a user's signed EIP-191 message (simple nonce + payload) locally
 - Submits a sponsored transaction to CrossChainRouter.requestVerification
 - Uses `infra/endpoints.json` and `shared/onchain-artifacts/addresses.json` + ABIs

 Note: This is intentionally minimal and unsafe for production. It stores keys in env vars.
*/
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

const ROOT = path.resolve(__dirname, '..', '..');
const ENDPOINTS = path.join(ROOT, 'infra', 'endpoints.json');
const ADDRESSES = path.join(ROOT, 'shared', 'onchain-artifacts', 'addresses.json');
const ABIS_DIR = path.join(ROOT, 'shared', 'onchain-artifacts', 'abis');

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function main() {
  const targetNetwork = process.env.TARGET_NETWORK || 'local';
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
  const userPrivateKey = process.env.USER_PRIVATE_KEY; // for simulation

  if (!relayerPrivateKey || !userPrivateKey) {
    console.error('Set RELAYER_PRIVATE_KEY and USER_PRIVATE_KEY in env');
    process.exit(1);
  }

  const endpoints = readJson(ENDPOINTS);
  const addresses = readJson(ADDRESSES);

  const netInfo = endpoints[targetNetwork];
  if (!netInfo) throw new Error(`no endpoint for ${targetNetwork}`);

  const rpc = netInfo.rpc || netInfo.url;
  if (!rpc) throw new Error(`no rpc for ${targetNetwork}`);

  const provider = new (ethers as any).providers.JsonRpcProvider(rpc);
  const relayer = new (ethers as any).Wallet(relayerPrivateKey, provider);
  const user = new (ethers as any).Wallet(userPrivateKey, provider);

  // Load CrossChainRouter ABI + address
  const routerKey = Object.keys(addresses).find(k => k.includes('CrossChainRouter') && k.includes(targetNetwork));
  const routerAddress = routerKey ? addresses[routerKey].address : addresses.local?.CrossChainRouter;
  const routerAbiPath = path.join(ABIS_DIR, 'CrossChainRouter.json');
  if (!routerAddress || !fs.existsSync(routerAbiPath)) {
    console.error('CrossChainRouter address or ABI missing in shared artifacts');
    process.exit(1);
  }

  const routerAbi = JSON.parse(fs.readFileSync(routerAbiPath, 'utf8'));
  // use any to avoid TypeScript contract typing mismatch across ethers versions
  const router: any = new (ethers as any).Contract(routerAddress, routerAbi, relayer);

  // Simulate a user signed request (EIP-191 simple signing)
  const destChainId = parseInt(process.env.DEST_CHAIN_ID || '1337002');
  const attestationLevel = parseInt(process.env.ATTESTATION_LEVEL || '1');
  const nonce = Date.now();
  const utils = (ethers as any).utils;
  const message = utils.defaultAbiCoder.encode(['uint256','address','uint8','uint256'], [destChainId, user.address, attestationLevel, nonce]);
  const messageHash = utils.keccak256(message);
  const signature = await user.signMessage(utils.arrayify(messageHash));

  console.log('User address:', user.address);
  console.log('Relayer address:', relayer.address);
  console.log('Message hash:', messageHash);
  console.log('Signature:', signature);

  // Relayer verifies signature
  const recovered = utils.recoverAddress(messageHash, signature);
  if (recovered.toLowerCase() !== user.address.toLowerCase()) {
    console.error('signature verification failed', recovered);
    process.exit(1);
  }
  console.log('Signature verified OK');

  // Send sponsored transaction: call requestVerification(destChainId, user.address, attestationLevel)
  const gasLimit = 5_000_000;
  const tx = await router.connect(relayer).requestVerification(destChainId, user.address, attestationLevel, { gasLimit });
  console.log('Sent sponsored tx hash:', tx.hash);
  const receipt = await tx.wait();
  console.log('Tx confirmed. Receipt:', receipt.transactionHash);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
