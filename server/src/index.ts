import { env } from './config/env.js';
import express from 'express';
import cors from 'cors';

import { ensureSchema } from "./db/init.js";
import { dbOk } from "./db/health.js";

import { homeRouter } from "./routes/home.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
app.use(cors());
app.use(express.json());

// health and status check
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/v1/status', (_req, res) => res.json({ api: 'v1', ok: true }));

// database connectivity check
app.get("/health/db", async (_req, res) => {
  try {
    res.json({ ok: await dbOk() });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

// routes
app.use("/api/v1", homeRouter);
app.use("/api/v1/auth", authRouter);

// global error handler
app.use(errorHandler);

// start the server after ensuring the database schema
(async () => {
  await ensureSchema();
  if (!Number.isFinite(env.PORT)) throw new Error("Invalid PORT");
  console.log(`Starting server on port ${env.PORT}`);
  app.listen(env.PORT);
})();