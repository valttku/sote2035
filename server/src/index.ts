import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { ensureSchema } from "./db/init.js";
import { dbOk } from "./db/healthCheck.js";

import { homeRouter } from "./routes/home.js";
import { authRouter } from "./routes/auth.js";
import { calendarRouter } from "./routes/calendar.js";
import { settingsRouter } from "./routes/settings.js";
import { meRouter } from "./routes/me.js";
import { digitalTwinRouter } from "./routes/digitalTwin.js";
import { openAIRouter } from "./routes/openAI.js";

import { polarRouter } from "./routes/integrations/polar.js";
import { garminRouter } from "./routes/integrations/garmin.js";

import { errorHandler } from "./middleware/error.js";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "https://sote2035-client.onrender.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// health and status check
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/v1/status", (_req, res) => res.json({ api: "v1", ok: true }));

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
app.use("/api/v1/calendar", calendarRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/me", meRouter);
app.use("/api/v1/digitalTwin", digitalTwinRouter);
app.use("/api/v1/openai", openAIRouter);

// providers (polar, garmin etc.)
app.use("/api/v1/integrations/polar", polarRouter);
app.use("/api/v1/integrations/garmin", garminRouter);

// global error handler
app.use(errorHandler);

// start the server after ensuring the database schema
(async () => {
  await ensureSchema();
  if (!Number.isFinite(env.PORT)) throw new Error("Invalid PORT");
  console.log(`Starting server on port ${env.PORT}`);
  app.listen(env.PORT);
})();
