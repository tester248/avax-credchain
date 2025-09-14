import { BrowserProvider, AbiCoder, keccak256, getBytes } from 'ethers';
import axios from 'axios';

export async function getProvider() {
  if ((window as any).ethereum) return new BrowserProvider((window as any).ethereum);
  throw new Error('No injected provider');
}

export async function signVerificationPayload(signer: any, meta: any) {
  // Simple abi encode and keccak256 like the existing demo
  const encoded = new AbiCoder().encode(['uint256','address','uint8','uint256'], [meta.destChainId, meta.userAddress, meta.attestationLevel || meta.requestedLevel || 1, meta.nonce || Math.floor(Date.now()/1000)]);
  const hash = keccak256(encoded);
  const sig = await signer.signMessage(getBytes(hash));
  return { messageHash: hash, signature: sig, meta };
}

export async function submitRelayerJob(payload: any) {
  const res = await axios.post('http://localhost:4000/v1/relayer/submit', payload);
  return res.data;
}

export async function pollJob(jobId: string, onUpdate: (status:any)=>void, maxAttempts = 30) {
  let attempts = 0;
  return new Promise<void>((resolve, reject) => {
    const iv = setInterval(async () => {
      attempts++;
      try {
        const s = await axios.get(`http://localhost:4000/v1/relayer/status/${jobId}`);
        onUpdate(s.data);
        if (s.data.status === 'done' || s.data.status === 'failed' || attempts > maxAttempts) {
          clearInterval(iv);
          resolve();
        }
      } catch (err:any) {
        clearInterval(iv);
        reject(err);
      }
    }, 1000);
  });
}
