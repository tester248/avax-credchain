"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ethers_1 = require("ethers");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// In-memory job store with simple file persistence
const DATA_DIR = path_1.default.resolve(__dirname, '..', '..', 'data');
const JOBS_FILE = path_1.default.join(DATA_DIR, 'jobs.json');
function ensureDataDir() {
    try {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    catch (e) { }
}
function loadJobs() {
    try {
        if (fs_1.default.existsSync(JOBS_FILE)) {
            const raw = fs_1.default.readFileSync(JOBS_FILE, 'utf8');
            return JSON.parse(raw || '{}');
        }
    }
    catch (e) {
        console.warn('relayer: failed to load jobs file', e);
    }
    return {};
}
function saveJobs(j) {
    try {
        ensureDataDir();
        fs_1.default.writeFileSync(JOBS_FILE, JSON.stringify(j, null, 2), 'utf8');
    }
    catch (e) {
        console.warn('relayer: failed to save jobs file', e);
    }
}
const jobs = loadJobs();
// POST /v1/relayer/submit
// body: { messageHash, signature, meta: { destChainId, attestationLevel, nonce, userAddress } }
router.post('/submit', async (req, res) => {
    try {
        const { messageHash, signature, meta } = req.body;
        if (!messageHash || !signature || !meta)
            return res.status(400).json({ error: 'missing fields' });
        const { userAddress } = meta;
        if (!userAddress)
            return res.status(400).json({ error: 'missing userAddress in meta' });
        // Recompute the ABI-encoded message and its keccak256 digest from meta (destChainId, userAddress, attestationLevel, nonce)
        let recomputedHash = null;
        try {
            const abiCoder = new ethers_1.AbiCoder();
            const encoded = abiCoder.encode(['uint256', 'address', 'uint8', 'uint256'], [meta.destChainId, meta.userAddress, meta.attestationLevel, meta.nonce]);
            recomputedHash = (0, ethers_1.keccak256)(encoded);
        }
        catch (err) {
            // ignore and fall back to provided messageHash
        }
        const effectiveHash = recomputedHash || messageHash;
        // Try a few deterministic recovery strategies using ethers v6 helpers
        let recovered = null;
        const tryCandidates = [];
        try {
            // 1) verifyMessage with raw bytes (most common when signer.signMessage(getBytes(hash)) used)
            try {
                recovered = (0, ethers_1.verifyMessage)((0, ethers_1.getBytes)(effectiveHash), signature);
                tryCandidates.push(`verifyMessage:bytes:${recovered}`);
            }
            catch (e) {
                // continue
            }
            // 2) verifyMessage with hex string
            if (!recovered) {
                try {
                    recovered = (0, ethers_1.verifyMessage)(effectiveHash, signature);
                    tryCandidates.push(`verifyMessage:hex:${recovered}`);
                }
                catch (e) {
                    // continue
                }
            }
            // 3) recoverAddress (expects a 32-byte digest and signature)
            if (!recovered) {
                try {
                    recovered = (0, ethers_1.recoverAddress)(effectiveHash, signature);
                    tryCandidates.push(`recoverAddress:${recovered}`);
                }
                catch (e) { }
            }
            // 4) Try parsing with Signature helper and recovering
            if (!recovered) {
                try {
                    const sigObj = ethers_1.Signature.from(signature);
                    try {
                        const anySig = sigObj;
                        if (anySig && typeof anySig.recover === 'function') {
                            recovered = anySig.recover(effectiveHash);
                            tryCandidates.push(`Signature.recover:${recovered}`);
                        }
                    }
                    catch (e) { }
                }
                catch (e) {
                    // ignore
                }
            }
        }
        catch (err) {
            console.error('relayer: signature recovery error', err);
        }
        console.debug('relayer: recovery candidates', tryCandidates);
        let verified = false;
        if (!recovered) {
            console.warn('relayer: signature recovery failed, accepting job as unverified', tryCandidates);
        }
        else if (recovered.toLowerCase() !== userAddress.toLowerCase()) {
            console.warn('relayer: signature recovered address does not match userAddress, accepting job as unverified', { recovered, userAddress });
        }
        else {
            verified = true;
        }
        const jobId = (0, uuid_1.v4)();
        jobs[jobId] = { status: 'queued', createdAt: Date.now(), meta: { ...meta, verified }, debug: { recovered, tryCandidates, effectiveHash } };
        // For the lightweight demo, we'll simulate processing after a short delay
        setTimeout(() => {
            jobs[jobId].status = 'processing';
            // simulate success and assign a mock txHash
            setTimeout(() => {
                jobs[jobId].status = 'done';
                jobs[jobId].txHash = '0x' + (0, uuid_1.v4)().replace(/-/g, '').slice(0, 64);
            }, 1500);
        }, 500);
        return res.json({ jobId });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// Debug helper: recover signature for an arbitrary payload (returns tried candidates)
router.post('/debug/recover', (req, res) => {
    const { messageHash, signature, meta } = req.body || {};
    if (!messageHash || !signature)
        return res.status(400).json({ error: 'missing fields' });
    let recomputedHash = null;
    try {
        if (meta) {
            const abi = new ethers_1.AbiCoder();
            recomputedHash = (0, ethers_1.keccak256)(abi.encode(['uint256', 'address', 'uint8', 'uint256'], [meta.destChainId, meta.userAddress, meta.attestationLevel, meta.nonce]));
        }
    }
    catch (e) { }
    const effectiveHash = recomputedHash || messageHash;
    const tryCandidates = [];
    let recovered = null;
    try {
        try {
            recovered = (0, ethers_1.verifyMessage)((0, ethers_1.getBytes)(effectiveHash), signature);
            tryCandidates.push(`verifyMessage:bytes:${recovered}`);
        }
        catch (e) { }
        try {
            if (!recovered) {
                recovered = (0, ethers_1.verifyMessage)(effectiveHash, signature);
                tryCandidates.push(`verifyMessage:hex:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                recovered = (0, ethers_1.verifyMessage)(Buffer.from(effectiveHash.slice(2), 'hex'), signature);
                tryCandidates.push(`verifyMessage:buffer:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                recovered = (0, ethers_1.recoverAddress)(effectiveHash, signature);
                tryCandidates.push(`recoverAddress:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                const dm = (0, ethers_1.hashMessage)((0, ethers_1.getBytes)(effectiveHash));
                recovered = (0, ethers_1.recoverAddress)(dm, signature);
                tryCandidates.push(`hashMessage:bytes:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                const dm2 = (0, ethers_1.hashMessage)(effectiveHash);
                recovered = (0, ethers_1.recoverAddress)(dm2, signature);
                tryCandidates.push(`hashMessage:hex:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                const sigObj = ethers_1.Signature.from(signature);
                try {
                    const anySig = sigObj;
                    if (anySig && typeof anySig.recover === 'function') {
                        recovered = anySig.recover(effectiveHash);
                        tryCandidates.push(`Signature.recover:${recovered}`);
                    }
                }
                catch (e) { }
            }
        }
        catch (e) { }
    }
    catch (err) {
        // ignore
    }
    return res.json({ effectiveHash, recovered, tryCandidates });
});
// Re-run verification for an existing job and update its verified flag
router.post('/reverify/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const job = jobs[jobId];
    if (!job)
        return res.status(404).json({ error: 'job not found' });
    const messageHash = req.body?.messageHash || job?.debug?.effectiveHash || job?.meta?.messageHash;
    const signature = req.body?.signature || job?.meta?.signature || job?.debug?.signature;
    const meta = job.meta || {};
    if (!messageHash || !signature)
        return res.status(400).json({ error: 'missing messageHash or signature; you can pass them in body or ensure job.debug contains them' });
    // reuse recovery strategies from debug
    let recomputedHash = null;
    try {
        if (meta) {
            const abi = new ethers_1.AbiCoder();
            recomputedHash = (0, ethers_1.keccak256)(abi.encode(['uint256', 'address', 'uint8', 'uint256'], [meta.destChainId, meta.userAddress, meta.attestationLevel, meta.nonce]));
        }
    }
    catch (e) { }
    const effectiveHash = recomputedHash || messageHash;
    const tryCandidates = [];
    let recovered = null;
    try {
        try {
            recovered = (0, ethers_1.verifyMessage)((0, ethers_1.getBytes)(effectiveHash), signature);
            tryCandidates.push(`verifyMessage:bytes:${recovered}`);
        }
        catch (e) { }
        try {
            if (!recovered) {
                recovered = (0, ethers_1.verifyMessage)(effectiveHash, signature);
                tryCandidates.push(`verifyMessage:hex:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                recovered = (0, ethers_1.verifyMessage)(Buffer.from(effectiveHash.slice(2), 'hex'), signature);
                tryCandidates.push(`verifyMessage:buffer:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                recovered = (0, ethers_1.recoverAddress)(effectiveHash, signature);
                tryCandidates.push(`recoverAddress:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                const dm = (0, ethers_1.hashMessage)((0, ethers_1.getBytes)(effectiveHash));
                recovered = (0, ethers_1.recoverAddress)(dm, signature);
                tryCandidates.push(`hashMessage:bytes:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                const dm2 = (0, ethers_1.hashMessage)(effectiveHash);
                recovered = (0, ethers_1.recoverAddress)(dm2, signature);
                tryCandidates.push(`hashMessage:hex:${recovered}`);
            }
        }
        catch (e) { }
        try {
            if (!recovered) {
                const sigObj = ethers_1.Signature.from(signature);
                try {
                    const anySig = sigObj;
                    if (anySig && typeof anySig.recover === 'function') {
                        recovered = anySig.recover(effectiveHash);
                        tryCandidates.push(`Signature.recover:${recovered}`);
                    }
                }
                catch (e) { }
            }
        }
        catch (e) { }
    }
    catch (err) {
        // ignore
    }
    let verified = false;
    if (!recovered) {
        verified = false;
    }
    else if (recovered.toLowerCase() !== (meta.userAddress || '').toLowerCase()) {
        verified = false;
    }
    else {
        verified = true;
    }
    // update job
    job.meta = { ...job.meta, verified };
    job.debug = { recovered, tryCandidates, effectiveHash };
    saveJobs(jobs);
    return res.json({ jobId, job });
});
// GET /v1/relayer/status/:jobId
router.get('/status/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job)
        return res.status(404).json({ error: 'job not found' });
    return res.json({ jobId: req.params.jobId, status: job.status, txHash: job.txHash || null });
});
// GET /v1/relayer/list
// Returns all jobs (id -> job object). Demo-only endpoint for admin UI.
router.get('/list', (_req, res) => {
    return res.json({ jobs });
});
// GET /v1/relayer/job/:jobId - return full job object
router.get('/job/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job)
        return res.status(404).json({ error: 'job not found' });
    return res.json({ jobId: req.params.jobId, job });
});
// POST /v1/relayer/create-fake
// body: { userAddress, destChainId, attestationLevel }
router.post('/create-fake', (req, res) => {
    const { userAddress, destChainId, attestationLevel } = req.body || {};
    if (!userAddress)
        return res.status(400).json({ error: 'userAddress required' });
    const jobId = (0, uuid_1.v4)();
    const meta = { userAddress, destChainId: destChainId || 1337, attestationLevel: attestationLevel || 1, nonce: Math.floor(Date.now() / 1000), verified: true };
    jobs[jobId] = { status: 'queued', createdAt: Date.now(), meta };
    // simulate processing
    setTimeout(() => {
        jobs[jobId].status = 'processing';
        setTimeout(() => {
            jobs[jobId].status = 'done';
            jobs[jobId].txHash = '0x' + (0, uuid_1.v4)().replace(/-/g, '').slice(0, 64);
        }, 1000);
    }, 300);
    return res.json({ jobId });
});
exports.default = router;
