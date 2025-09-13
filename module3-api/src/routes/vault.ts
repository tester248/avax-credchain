import express, { Request, Response } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import PinataSDK from '@pinata/sdk';

const router = express.Router();

// POST /api/vault/upload
// Accepts multipart file in `file` or JSON body with `data` and returns a CID/URL
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    let content: Buffer | string;

    if ((req as any).file && (req as any).file.buffer) {
      content = (req as any).file.buffer as Buffer;
    } else if (req.body && Object.keys(req.body).length) {
      content = Buffer.from(JSON.stringify(req.body), 'utf8');
    } else {
      return res.status(400).json({ error: 'no file or body provided' });
    }

    // If Pinata env vars are set, attempt to pin via Pinata SDK
    const key = process.env.PINATA_API_KEY || '';
    const secret = process.env.PINATA_API_SECRET || '';
    if (key && secret) {
      const pinata = new PinataSDK({ pinataApiKey: key, pinataSecretApiKey: secret });
      // pinFileToIPFS expects a stream or file; we'll write a temp file and send stream
      const tmpDir = path.join(os.tmpdir(), 'module3-vault');
      fs.mkdirSync(tmpDir, { recursive: true });
      const filename = `payload-${now}.json`;
      const filepath = path.join(tmpDir, filename);
  fs.writeFileSync(filepath, content as any);

      const stream = fs.createReadStream(filepath);
      const result = await pinata.pinFileToIPFS(stream);
      // result.ipfsHash contains the CID
      return res.json({ storage: 'pinata', cid: result.ipfsHash, ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}` });
    }

    // Fallback: write to tmp and return a mock CID/URL
    const tmpDir = path.join(os.tmpdir(), 'module3-vault');
    fs.mkdirSync(tmpDir, { recursive: true });
    const filename = `payload-${now}.json`;
    const filepath = path.join(tmpDir, filename);
  fs.writeFileSync(filepath, content as any);
    const fakeCid = `bafy${now}`;
    const url = `https://mock.storage/${fakeCid}`;
    return res.json({ storage: 'mock', cid: fakeCid, url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
