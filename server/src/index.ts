import { env } from './config/env.js';
import express from 'express';
import cors from 'cors';
import { homeRouter } from "./routes/home.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/v1/status', (_req, res) => res.json({ api: 'v1', ok: true }));

// home route
app.use("/api/v1", homeRouter);

if (!Number.isFinite(env.PORT)) throw new Error('Invalid PORT');
console.log(`Starting server on port ${env.PORT}`);
app.listen(env.PORT);