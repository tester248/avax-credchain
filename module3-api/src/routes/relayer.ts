import express, { Request, Response } from 'express';
import * as ethers from 'ethers';
import { verifyMessage, getBytes, recoverAddress, Signature, AbiCoder, keccak256, hashMessage } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// In-memory job store with simple file persistence
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
function ensureDataDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}
function loadJobs(): Record<string, any> {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const raw = fs.readFileSync(JOBS_FILE, 'utf8');
      return JSON.parse(raw || '{}');
    }
  } catch (e) {
    console.warn('relayer: failed to load jobs file', e);
  }
  return {};
}
function saveJobs(j: Record<string, any>) {
  try {
    ensureDataDir();
    fs.writeFileSync(JOBS_FILE, JSON.stringify(j, null, 2), 'utf8');
  } catch (e) {
    console.warn('relayer: failed to save jobs file', e);
  }
}

// Helper function to complete HR verification when relayer job is done
async function completeHRVerification(ticketId: string, verified: boolean, signature?: string, signedPayload?: string, verifiedAddress?: string) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:4000'}/api/hr/verification/complete/${ticketId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: verified,
        signature,
        signedPayload,
        verifiedAddress
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to complete HR verification:', await response.text());
    } else {
      console.log('HR verification completed for ticket:', ticketId);
    }
  } catch (error) {
    console.error('Error completing HR verification:', error);
  }
}

const jobs: Record<string, any> = loadJobs();

// POST /v1/relayer/submit
// body: { messageHash, signature, meta: { destChainId, attestationLevel, nonce, userAddress, hrTicketId? } }
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { messageHash, signature, meta } = req.body;
    if (!messageHash || !signature || !meta) return res.status(400).json({ error: 'missing fields' });
    const { userAddress, hrTicketId } = meta;
    if (!userAddress) return res.status(400).json({ error: 'missing userAddress in meta' });

    // Recompute the ABI-encoded message and its keccak256 digest from meta (destChainId, userAddress, attestationLevel, nonce)
    let recomputedHash: string | null = null;
    try {
      const abiCoder = new AbiCoder();
      const encoded = abiCoder.encode(['uint256','address','uint8','uint256'], [meta.destChainId, meta.userAddress, meta.attestationLevel, meta.nonce]);
      recomputedHash = keccak256(encoded);
    } catch (err) {
      // ignore and fall back to provided messageHash
    }
    const effectiveHash = recomputedHash || messageHash;

    // Try a few deterministic recovery strategies using ethers v6 helpers
    let recovered: string | null = null;
    const tryCandidates: Array<string> = [];
    try {
      // 1) verifyMessage with raw bytes (most common when signer.signMessage(getBytes(hash)) used)
      try {
        recovered = verifyMessage(getBytes(effectiveHash), signature);
        tryCandidates.push(`verifyMessage:bytes:${recovered}`);
      } catch (e) {
        // continue
      }

      // 2) verifyMessage with hex string
      if (!recovered) {
        try {
          recovered = verifyMessage(effectiveHash, signature as any);
          tryCandidates.push(`verifyMessage:hex:${recovered}`);
        } catch (e) {
          // continue
        }
      }

      // 3) recoverAddress (expects a 32-byte digest and signature)
      if (!recovered) {
        try {
          recovered = recoverAddress(effectiveHash, signature as any);
          tryCandidates.push(`recoverAddress:${recovered}`);
        } catch (e) {}
      }

      // 4) Try parsing with Signature helper and recovering
      if (!recovered) {
        try {
          const sigObj = Signature.from(signature as any);
          try {
            const anySig: any = sigObj as any;
            if (anySig && typeof anySig.recover === 'function') {
              recovered = anySig.recover(effectiveHash);
              tryCandidates.push(`Signature.recover:${recovered}`);
            }
          } catch (e) {}
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('relayer: signature recovery error', err);
    }
    console.debug('relayer: recovery candidates', tryCandidates);
    let verified = false;
    if (!recovered) {
      console.warn('relayer: signature recovery failed, accepting job as unverified', tryCandidates);
    } else if (recovered.toLowerCase() !== userAddress.toLowerCase()) {
      console.warn('relayer: signature recovered address does not match userAddress, accepting job as unverified', { recovered, userAddress });
    } else {
      verified = true;
    }

    const jobId = uuidv4();
  jobs[jobId] = { status: 'queued', createdAt: Date.now(), meta: { ...meta, verified }, debug: { recovered, tryCandidates, effectiveHash } };

    // For the lightweight demo, we'll simulate processing after a short delay
    setTimeout(() => {
      jobs[jobId].status = 'processing';
      // simulate success and assign a mock txHash
      setTimeout(() => {
        jobs[jobId].status = 'done';
        jobs[jobId].txHash = '0x' + uuidv4().replace(/-/g, '').slice(0, 64);
        saveJobs(jobs);
        
        // If this is an HR verification request, complete it
        if (hrTicketId) {
          completeHRVerification(hrTicketId, verified, signature, messageHash, recovered || undefined);
        }
      }, 1500);
    }, 500);

    return res.json({ jobId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Debug helper: recover signature for an arbitrary payload (returns tried candidates)
router.post('/debug/recover', (req: Request, res: Response) => {
  const { messageHash, signature, meta } = req.body || {};
  if (!messageHash || !signature) return res.status(400).json({ error: 'missing fields' });
  let recomputedHash: string | null = null;
  try {
    if (meta) {
      const abi = new AbiCoder();
      recomputedHash = keccak256(abi.encode(['uint256','address','uint8','uint256'], [meta.destChainId, meta.userAddress, meta.attestationLevel, meta.nonce]));
    }
  } catch (e) {}
  const effectiveHash = recomputedHash || messageHash;
  const tryCandidates: string[] = [];
  let recovered: string | null = null;
  try {
    try { recovered = verifyMessage(getBytes(effectiveHash), signature); tryCandidates.push(`verifyMessage:bytes:${recovered}`); } catch(e){}
    try { if (!recovered) { recovered = verifyMessage(effectiveHash, signature as any); tryCandidates.push(`verifyMessage:hex:${recovered}`); } } catch(e){}
    try { if (!recovered) { recovered = verifyMessage(Buffer.from(effectiveHash.slice(2), 'hex') as any, signature); tryCandidates.push(`verifyMessage:buffer:${recovered}`); } } catch(e){}
    try { if (!recovered) { recovered = recoverAddress(effectiveHash, signature as any); tryCandidates.push(`recoverAddress:${recovered}`); } } catch(e){}
    try { if (!recovered) { const dm = hashMessage(getBytes(effectiveHash)); recovered = recoverAddress(dm, signature as any); tryCandidates.push(`hashMessage:bytes:${recovered}`); } } catch(e){}
    try { if (!recovered) { const dm2 = hashMessage(effectiveHash as any); recovered = recoverAddress(dm2, signature as any); tryCandidates.push(`hashMessage:hex:${recovered}`); } } catch(e){}
  try { if (!recovered) { const sigObj = Signature.from(signature as any); try { const anySig: any = sigObj as any; if (anySig && typeof anySig.recover === 'function') { recovered = anySig.recover(effectiveHash); tryCandidates.push(`Signature.recover:${recovered}`); } } catch(e){} } } catch(e){}
  } catch (err) {
    // ignore
  }
  return res.json({ effectiveHash, recovered, tryCandidates });
});

// Re-run verification for an existing job and update its verified flag
router.post('/reverify/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const job = jobs[jobId];
  if (!job) return res.status(404).json({ error: 'job not found' });
  const messageHash = req.body?.messageHash || job?.debug?.effectiveHash || job?.meta?.messageHash;
  const signature = req.body?.signature || job?.meta?.signature || job?.debug?.signature;
  const meta = job.meta || {};
  if (!messageHash || !signature) return res.status(400).json({ error: 'missing messageHash or signature; you can pass them in body or ensure job.debug contains them' });

  // reuse recovery strategies from debug
  let recomputedHash: string | null = null;
  try {
    if (meta) {
      const abi = new AbiCoder();
      recomputedHash = keccak256(abi.encode(['uint256','address','uint8','uint256'], [meta.destChainId, meta.userAddress, meta.attestationLevel, meta.nonce]));
    }
  } catch (e) {}
  const effectiveHash = recomputedHash || messageHash;
  const tryCandidates: string[] = [];
  let recovered: string | null = null;
  try {
    try { recovered = verifyMessage(getBytes(effectiveHash), signature); tryCandidates.push(`verifyMessage:bytes:${recovered}`); } catch(e){}
    try { if (!recovered) { recovered = verifyMessage(effectiveHash, signature as any); tryCandidates.push(`verifyMessage:hex:${recovered}`); } } catch(e){}
    try { if (!recovered) { recovered = verifyMessage(Buffer.from(effectiveHash.slice(2), 'hex') as any, signature); tryCandidates.push(`verifyMessage:buffer:${recovered}`); } } catch(e){}
    try { if (!recovered) { recovered = recoverAddress(effectiveHash, signature as any); tryCandidates.push(`recoverAddress:${recovered}`); } } catch(e){}
    try { if (!recovered) { const dm = hashMessage(getBytes(effectiveHash)); recovered = recoverAddress(dm, signature as any); tryCandidates.push(`hashMessage:bytes:${recovered}`); } } catch(e){}
    try { if (!recovered) { const dm2 = hashMessage(effectiveHash as any); recovered = recoverAddress(dm2, signature as any); tryCandidates.push(`hashMessage:hex:${recovered}`); } } catch(e){}
    try { if (!recovered) { const sigObj = Signature.from(signature as any); try { const anySig: any = sigObj as any; if (anySig && typeof anySig.recover === 'function') { recovered = anySig.recover(effectiveHash); tryCandidates.push(`Signature.recover:${recovered}`); } } catch(e){} } } catch(e){}
  } catch (err) {
    // ignore
  }

  let verified = false;
  if (!recovered) {
    verified = false;
  } else if (recovered.toLowerCase() !== (meta.userAddress || '').toLowerCase()) {
    verified = false;
  } else {
    verified = true;
  }

  // update job
  job.meta = { ...job.meta, verified };
  job.debug = { recovered, tryCandidates, effectiveHash };
  saveJobs(jobs);
  return res.json({ jobId, job });
});

// GET /v1/relayer/status/:jobId
router.get('/status/:jobId', (req: Request, res: Response) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'job not found' });
  return res.json({ jobId: req.params.jobId, status: job.status, txHash: job.txHash || null });
});

// GET /v1/relayer/list
// Returns all jobs (id -> job object). Demo-only endpoint for admin UI.
router.get('/list', (_req: Request, res: Response) => {
  return res.json({ jobs });
});

// GET /v1/relayer/job/:jobId - return full job object
router.get('/job/:jobId', (req: Request, res: Response) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'job not found' });
  return res.json({ jobId: req.params.jobId, job });
});

// POST /v1/relayer/create-fake
// body: { userAddress, destChainId, attestationLevel }
router.post('/create-fake', (req: Request, res: Response) => {
  const { userAddress, destChainId, attestationLevel } = req.body || {};
  if (!userAddress) return res.status(400).json({ error: 'userAddress required' });
  const jobId = uuidv4();
  const meta = { userAddress, destChainId: destChainId || 1337001, attestationLevel: attestationLevel || 1, nonce: Math.floor(Date.now()/1000), verified: true };
  jobs[jobId] = { status: 'queued', createdAt: Date.now(), meta };
  // simulate processing
  setTimeout(() => {
    jobs[jobId].status = 'processing';
    setTimeout(() => {
      jobs[jobId].status = 'done';
      jobs[jobId].txHash = '0x' + uuidv4().replace(/-/g, '').slice(0, 64);
    }, 1000);
  }, 300);
  return res.json({ jobId });
});

export default router;
