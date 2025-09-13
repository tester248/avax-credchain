"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const sdk_1 = __importDefault(require("@pinata/sdk"));
const router = express_1.default.Router();
// POST /api/vault/upload
// Accepts multipart file in `file` or JSON body with `data` and returns a CID/URL
router.post('/upload', async (req, res) => {
    try {
        const now = Date.now();
        let content;
        if (req.file && req.file.buffer) {
            content = req.file.buffer;
        }
        else if (req.body && Object.keys(req.body).length) {
            content = Buffer.from(JSON.stringify(req.body), 'utf8');
        }
        else {
            return res.status(400).json({ error: 'no file or body provided' });
        }
        // If Pinata env vars are set, attempt to pin via Pinata SDK
        const key = process.env.PINATA_API_KEY || '';
        const secret = process.env.PINATA_API_SECRET || '';
        if (key && secret) {
            const pinata = new sdk_1.default({ pinataApiKey: key, pinataSecretApiKey: secret });
            // pinFileToIPFS expects a stream or file; we'll write a temp file and send stream
            const tmpDir = path_1.default.join(os_1.default.tmpdir(), 'module3-vault');
            fs_1.default.mkdirSync(tmpDir, { recursive: true });
            const filename = `payload-${now}.json`;
            const filepath = path_1.default.join(tmpDir, filename);
            fs_1.default.writeFileSync(filepath, content);
            const stream = fs_1.default.createReadStream(filepath);
            const result = await pinata.pinFileToIPFS(stream);
            // result.ipfsHash contains the CID
            return res.json({ storage: 'pinata', cid: result.ipfsHash, ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}` });
        }
        // Fallback: write to tmp and return a mock CID/URL
        const tmpDir = path_1.default.join(os_1.default.tmpdir(), 'module3-vault');
        fs_1.default.mkdirSync(tmpDir, { recursive: true });
        const filename = `payload-${now}.json`;
        const filepath = path_1.default.join(tmpDir, filename);
        fs_1.default.writeFileSync(filepath, content);
        const fakeCid = `bafy${now}`;
        const url = `https://mock.storage/${fakeCid}`;
        return res.json({ storage: 'mock', cid: fakeCid, url });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
exports.default = router;
