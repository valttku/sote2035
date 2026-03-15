import { Router } from "express";
import { authRequired } from "../middleware/authRequired.js";
import { db } from "../db/db.js";
import { fetchGarminInsights, fetchPolarInsights } from "../services/healthInsightsService.js";

export const healthInsightsRouter = Router();

// GET /api/v1/health-insights?date=YYYY-MM-DD
// Unified endpoint — checks active_provider and returns data from the right tables.
// Response shape matches the Garmin endpoint so the client works without branching.
// The `provider` field tells the client which sections are available.
healthInsightsRouter.get("/", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;

    // Get date from query params, default to today
    const date =
      typeof req.query.date === "string"
        ? req.query.date
        : new Date().toISOString().split("T")[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Look up the user's active provider
    const userResult = await db.query(
      `SELECT active_provider FROM app.users WHERE id = $1`,
      [userId],
    );
    const provider: string | null = userResult.rows[0]?.active_provider ?? null;

    if (provider === "garmin") {
      return res.json({ provider, ...(await fetchGarminInsights(userId, date)) });
    }

    if (provider === "polar") {
      return res.json({ provider, ...(await fetchPolarInsights(userId, date)) });
    }

    // No provider linked
    return res.json({ provider: null });
  } catch (e) {
    next(e);
  }
});