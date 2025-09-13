"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// GET /api/contracts/abis
// Returns merged ABIs and addresses from shared artifacts directory if present
router.get('/abis', (_req, res) => {
    const dir = path_1.default.resolve(process.cwd(), 'shared/onchain-artifacts');
    try {
        if (!fs_1.default.existsSync(dir)) {
            return res.json({ message: 'no shared artifacts found', dir });
        }
        const files = fs_1.default.readdirSync(dir).filter(f => f.endsWith('.json'));
        const artifacts = {};
        for (const f of files) {
            try {
                artifacts[f] = JSON.parse(fs_1.default.readFileSync(path_1.default.join(dir, f), 'utf8'));
            }
            catch (err) {
                // skip invalid
            }
        }
        return res.json({ artifacts });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
exports.default = router;
