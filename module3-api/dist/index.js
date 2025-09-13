"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const vault_1 = __importDefault(require("./routes/vault"));
const teleporter_1 = __importDefault(require("./routes/teleporter"));
const contracts_1 = __importDefault(require("./routes/contracts"));
const hr_1 = __importDefault(require("./routes/hr"));
// Load environment variables from a .env file if present. Note: repo contains env.sh
// (a shell script). For local development source env.sh in your shell or convert
// values into a .env file so dotenv can read them.
dotenv_1.default.config();
const app = (0, express_1.default)();
const upload = (0, multer_1.default)();
// Use Express built-in body parsers (no body-parser package required)
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/vault', upload.single('file'), vault_1.default);
app.use('/api/teleporter', teleporter_1.default);
app.use('/api/contracts', contracts_1.default);
app.use('/api/hr', hr_1.default);
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Module3 API listening on port ${port}`);
});
