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
    // Try multiple locations in order of preference so the API works whether
    // it's started from the repo root or from inside `module3-api`.
    const candidates = [
        // repo-root relative (from this file: up 3 levels to repo root)
        path_1.default.resolve(__dirname, '../../../shared/onchain-artifacts'),
        // process cwd (how the server used to resolve)
        path_1.default.resolve(process.cwd(), 'shared/onchain-artifacts'),
        // module3-api-local fallback
        path_1.default.resolve(__dirname, '../../shared/onchain-artifacts'),
    ];
    let foundDir = null;
    for (const c of candidates) {
        if (fs_1.default.existsSync(c)) {
            foundDir = c;
            break;
        }
    }
    if (!foundDir) {
        return res.json({ message: 'no shared artifacts found', tried: candidates });
    }
    try {
        const files = fs_1.default.readdirSync(foundDir).filter(f => f.endsWith('.json'));
        const artifacts = {};
        for (const f of files) {
            try {
                artifacts[f] = JSON.parse(fs_1.default.readFileSync(path_1.default.join(foundDir, f), 'utf8'));
            }
            catch (err) {
                // skip invalid
            }
        }
        return res.json({ artifacts, dir: foundDir });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
exports.default = router;
