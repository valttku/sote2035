import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/v1/status', (_req, res) => res.json({ api: 'v1', ok: true }));

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {});
