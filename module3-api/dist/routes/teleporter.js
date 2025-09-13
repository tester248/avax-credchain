"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// POST /api/teleporter/send
// body: { destChainId, user, attestationLevel, metadata }
router.post('/send', async (req, res) => {
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
exports.default = router;
