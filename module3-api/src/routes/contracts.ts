import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GET /api/contracts/abis
// Returns merged ABIs and addresses from shared artifacts directory if present
router.get('/abis', (_req: Request, res: Response) => {
  const dir = path.resolve(process.cwd(), 'shared/onchain-artifacts');
  try {
    if (!fs.existsSync(dir)) {
      return res.json({ message: 'no shared artifacts found', dir });
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const artifacts: Record<string, any> = {};
    for (const f of files) {
      try {
        artifacts[f] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      } catch (err) {
        // skip invalid
      }
    }
    return res.json({ artifacts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
