import express from "express";
import { db } from "../../db/db.js";
import {
  upsertHealthMetrics,
  mapUserMetricsToRows,
} from "../../db/healthMetricsDb.js";

export const garminWebhookRouter = express.Router();

// POST /api/v1/integrations/garmin/webhook/user-metrics
// Garmin webhook for user metrics (data pushed by Garmin)
garminWebhookRouter.post("/user-metrics", async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of payload) {
      const providerUserId = item.userId;
      if (!providerUserId) continue;

      // 1. Map Garmin user → internal user
      const r = await db.query(
        `
        SELECT user_id
        FROM app.user_integrations
        WHERE provider = 'garmin' AND provider_user_id = $1
        `,
        [providerUserId],
      );

      if (r.rowCount === 0) {
        console.warn("Garmin user not linked:", providerUserId);
        continue;
      }

      const user_id = r.rows[0].user_id;

      // 2. Convert to health_metrics_daily rows
      const rows = mapUserMetricsToRows(user_id, item);

      // 3. Upsert
      if (rows.length) {
        await upsertHealthMetrics(rows);
      }
    }

    // Garmin expects 200 always
    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin user-metrics webhook failed:", err);
    // Still return 200 to avoid retries storm
    res.sendStatus(200);
  }
});

export default garminWebhookRouter;
