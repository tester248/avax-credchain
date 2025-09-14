import axios from 'axios';
import { ethers } from 'ethers';

async function main() {
  // create a random wallet for demo
  const wallet = ethers.Wallet.createRandom();
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9650/ext/bc/C/rpc');
  const address = await wallet.getAddress();

  const destChainId = 1337002;
  const attestationLevel = 1;
  const nonce = Math.floor(Date.now() / 1000);
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(['uint256','address','uint8','uint256'], [destChainId, address, attestationLevel, nonce]);
  const hash = ethers.keccak256(encoded);
  const signature = await wallet.signMessage(ethers.getBytes(hash));

  console.log('Submitting signed payload for', address);
  const res = await axios.post('http://localhost:4000/v1/relayer/submit', { messageHash: hash, signature, meta: { destChainId, attestationLevel, nonce, userAddress: address } });
  console.log('JobId:', res.data.jobId);
  const jobId = res.data.jobId;

  // poll status
  for (let i=0;i<10;i++){
    const s = await axios.get(`http://localhost:4000/v1/relayer/status/${jobId}`);
    console.log('status', s.data);
    if (s.data.status === 'done') break;
    await new Promise(r=>setTimeout(r,500));
  }
}

main().catch(console.error);
