import express, { Request, Response } from 'express';

const router = express.Router();

// POST /api/teleporter/send
// body: { destChainId, user, attestationLevel, metadata }
router.post('/send', async (req: Request, res: Response) => {
  const { destChainId, user, attestationLevel } = req.body || {};
  if (!destChainId || !user) {
    return res.status(400).json({ error: 'destChainId and user required' });
  }

  // In a production setup this would call an SDK or the Teleporter contract.
  // For now, return a mock requestId and echo payload.
  const requestId = `req_${Date.now()}`;
  const payload = { requestId, destChainId, user, attestationLevel };

  return res.json({ requestId, payload, sent: true });
});

export default router;
