"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// POST /api/hr/register
// Accepts: { userAddress, jurisdiction, ipfsCid }
router.post('/register', (req, res) => {
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
router.post('/attest', (req, res) => {
    const { userAddress, level, metadataCid } = req.body || {};
    if (!userAddress || !level) {
        return res.status(400).json({ error: 'userAddress and level required' });
    }
    const attestation = { id: `att_${Date.now()}`, userAddress, level, metadataCid };
    return res.json({ attestation, status: 'created' });
});
// POST /api/hr/crosschain/request
// Accepts: { destChainId, userAddress, requestedLevel }
router.post('/crosschain/request', (req, res) => {
    const { destChainId, userAddress, requestedLevel } = req.body || {};
    if (!destChainId || !userAddress) {
        return res.status(400).json({ error: 'destChainId and userAddress required' });
    }
    const requestId = `ccr_${Date.now()}`;
    return res.json({ requestId, destChainId, userAddress, requestedLevel });
});
exports.default = router;
