import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory demo users store
const demoUsers: Array<any> = [
  { address: '0x0000000000000000000000000000000000000001', name: 'Alice', attestationLevel: 2 },
  { address: '0x0000000000000000000000000000000000000002', name: 'Bob', attestationLevel: 1 },
  { address: '0x0000000000000000000000000000000000000003', name: 'Carol', attestationLevel: 0 }
];

// GET /api/hr/users - list demo users
router.get('/users', (_req: Request, res: Response) => {
  return res.json({ users: demoUsers });
});

// POST /api/hr/seed - reset/seed demo users (optional)
router.post('/seed', (_req: Request, res: Response) => {
  // For demo we simply return the existing seed; a full implementation could accept a body
  return res.json({ users: demoUsers });
});

// POST /api/hr/register
// Accepts: { userAddress, jurisdiction, ipfsCid }
router.post('/register', (req: Request, res: Response) => {
  const { userAddress, jurisdiction, ipfsCid } = req.body || {};
  if (!userAddress || !ipfsCid) {
    return res.status(400).json({ error: 'userAddress and ipfsCid required' });
  }

  // In a full implementation this would submit a transaction via a relayer
  const tx = { txHash: `0xreg${Date.now()}`, status: 'submitted' };
  return res.json({ tx, userAddress, jurisdiction, ipfsCid });
});

// POST /api/hr/attest
// Accepts: { userAddress, level, metadataCid }
router.post('/attest', (req: Request, res: Response) => {
  const { userAddress, level, metadataCid } = req.body || {};
  if (!userAddress || !level) {
    return res.status(400).json({ error: 'userAddress and level required' });
  }
  const attestation = { id: `att_${Date.now()}`, userAddress, level, metadataCid };
  return res.json({ attestation, status: 'created' });
});

// POST /api/hr/crosschain/request
// Accepts: { destChainId, userAddress, requestedLevel }
router.post('/crosschain/request', (req: Request, res: Response) => {
  const { destChainId, userAddress, requestedLevel } = req.body || {};
  if (!destChainId || !userAddress) {
    return res.status(400).json({ error: 'destChainId and userAddress required' });
  }
  const requestId = `ccr_${Date.now()}`;
  return res.json({ requestId, destChainId, userAddress, requestedLevel });
});

export default router;
