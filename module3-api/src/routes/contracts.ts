import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GET /api/contracts/abis
// Returns merged ABIs and addresses from shared artifacts directory if present
router.get('/abis', (_req: Request, res: Response) => {
  // Try multiple locations in order of preference so the API works whether
  // it's started from the repo root or from inside `module3-api`.
  const candidates = [
    // repo-root relative (from this file: up 3 levels to repo root)
    path.resolve(__dirname, '../../../shared/onchain-artifacts'),
    // process cwd (how the server used to resolve)
    path.resolve(process.cwd(), 'shared/onchain-artifacts'),
    // module3-api-local fallback
    path.resolve(__dirname, '../../shared/onchain-artifacts'),
  ];

  let foundDir: string | null = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      foundDir = c;
      break;
    }
  }

  if (!foundDir) {
    return res.json({ message: 'no shared artifacts found', tried: candidates });
  }

  try {
    const files = fs.readdirSync(foundDir).filter(f => f.endsWith('.json'));
    const artifacts: Record<string, any> = {};
    for (const f of files) {
      try {
        artifacts[f] = JSON.parse(fs.readFileSync(path.join(foundDir, f), 'utf8'));
      } catch (err) {
        // skip invalid
      }
    }
    return res.json({ artifacts, dir: foundDir });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
