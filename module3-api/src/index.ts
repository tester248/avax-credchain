import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';

import vaultRouter from './routes/vault';
import teleporterRouter from './routes/teleporter';
import contractsRouter from './routes/contracts';
import hrRouter from './routes/hr';
import relayerRouter from './routes/relayer';

// Load environment variables from a .env file if present. Note: repo contains env.sh
// (a shell script). For local development source env.sh in your shell or convert
// values into a .env file so dotenv can read them.
dotenv.config();

const app = express();
const upload = multer();

// Use Express built-in body parsers (no body-parser package required)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Enable CORS for local dev UI (adjust/lock down origins for production)
app.use(cors());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/vault', upload.single('file'), vaultRouter);
app.use('/api/teleporter', teleporterRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/hr', hrRouter);
app.use('/v1/relayer', relayerRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Module3 API listening on port ${port}`);
});
