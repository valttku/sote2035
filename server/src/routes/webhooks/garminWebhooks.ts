import express from "express";
import { db } from "../../db/db.js";
import {
  upsertUserMetrics,
  mapUserMetricsToRows,
} from "../../db/userMetricsDb";
import { mapDailiesToRows, upsertDailies } from "../../db/userDailiesDb.js";

// Router for Garmin webhooks

export const garminWebhookRouter = express.Router();

// POST /api/v1/integrations/garmin/webhook/user-metrics
// Garmin webhook for user metrics (data pushed by Garmin)
garminWebhookRouter.post("/user-metrics", async (req, res) => {
  console.log("Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of payload) {
      const providerUserId = item.userId;
      console.log("Processing Garmin user:", providerUserId);
      if (!providerUserId) continue;

      const r = await db.query(
        `
        SELECT user_id
        FROM app.user_integrations
        WHERE provider = 'garmin' AND provider_user_id = $1
        `,
        [providerUserId],
      );

      console.log("Found internal user:", r.rows[0]?.user_id);

      if (r.rowCount === 0) {
        console.warn("Garmin user not linked:", providerUserId);
        continue;
      }

      const user_id = r.rows[0].user_id;
      const rows = mapUserMetricsToRows(user_id, item);
      console.log("Mapped rows:", rows);

      if (rows.length) {
        await upsertUserMetrics(rows);
        console.log("Inserted", rows.length, "metrics");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin webhook failed:", err);
    res.sendStatus(200);
  }
});

// POST /api/v1/integrations/garmin/webhook/dailies
// Garmin webhook for dailies (data pushed by Garmin)
garminWebhookRouter.post("/dailies", async (req, res) => {
  console.log("Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of payload) {
      const providerUserId = item.userId;
      console.log("Processing Garmin user:", providerUserId);
      if (!providerUserId) continue;

      const r = await db.query(
        `
        SELECT user_id
        FROM app.user_integrations
        WHERE provider = 'garmin' AND provider_user_id = $1
        `,
        [providerUserId],
      );

      console.log("Found internal user:", r.rows[0]?.user_id);

      if (r.rowCount === 0) {
        console.warn("Garmin user not linked:", providerUserId);
        continue;
      }

      const user_id = r.rows[0].user_id;
      const rows = mapDailiesToRows(user_id, item);
      console.log("Mapped rows:", rows);

      if (rows.length) {
        await upsertDailies(rows);
        console.log("Inserted dailies data");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin dailies webhook failed:", err);
    res.sendStatus(200);
  }
});

export default garminWebhookRouter;
