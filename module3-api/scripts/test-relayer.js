const axios = require('axios');
const E = require('ethers');
const ethers = E.ethers || E.default || E;

async function main() {
  const wallet = ethers.Wallet.createRandom();
  const address = wallet.address;

  const destChainId = 1337002;
  const attestationLevel = 1;
  const nonce = Math.floor(Date.now() / 1000);

  // Use top-level AbiCoder and keccak256 provided by this ethers build
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(['uint256','address','uint8','uint256'], [destChainId, address, attestationLevel, nonce]);
  const hash = ethers.keccak256(encoded);
  // Sign the digest by passing raw bytes to signMessage
  const signature = await wallet.signMessage(Buffer.from(hash.slice(2), 'hex'));

  console.log('Submitting signed payload for', address);
  const res = await axios.post('http://localhost:4000/v1/relayer/submit', { messageHash: hash, signature, meta: { destChainId, attestationLevel, nonce, userAddress: address } });
  console.log('JobId:', res.data.jobId);
  const jobId = res.data.jobId;

  // poll status
  for (let i=0;i<20;i++){
    const s = await axios.get(`http://localhost:4000/v1/relayer/status/${jobId}`);
    console.log('status', s.data);
    if (s.data.status === 'done') break;
    await new Promise(r=>setTimeout(r,500));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
