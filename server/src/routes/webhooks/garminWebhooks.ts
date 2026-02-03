import express from "express";
import { db } from "../../db/db.js";
import {
  upsertGarminUserMetrics,
  mapGarminUserMetricsToRows,
} from "../../db/garmin/metrics.js";
import {
  upsertGarminDailies,
  mapGarminDailiesToRows,
} from "../../db/garmin/dailies.js";
import {
  mapGarminHrvToRow,
  upsertGarminHrv,
} from "../../db/garmin/hrv.js";
import { mapGarminSkinTempToRow, upsertGarminSkinTemp } from "../../db/garmin/skinTemp.js";
import { mapGarminSleepToRow, upsertGarminSleep } from "../../db/garmin/sleep.js";

// Router for Garmin webhooks

export const garminWebhookRouter = express.Router();

// POST /api/v1/integrations/garmin/webhook/user-metrics
// Garmin webhook for user metrics (data pushed by Garmin)
garminWebhookRouter.post("/user-metrics", async (req, res) => {
  console.log("Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    // Handle array wrapped by summary type
    const payload =
      req.body.userMetrics || (Array.isArray(req.body) ? req.body : [req.body]);

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
      const row = mapGarminUserMetricsToRows(user_id, item);
      console.log("Mapped row:", row);
      await upsertGarminUserMetrics(row);
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
    // Handle array wrapped by summary type
    const payload =
      req.body.dailies || (Array.isArray(req.body) ? req.body : [req.body]);

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
      const rows = mapGarminDailiesToRows(user_id, item);
      console.log("Mapped row:", rows);

      if (rows.length) {
        await upsertGarminDailies(rows);
        console.log("Inserted dailies data");
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin dailies webhook failed:", err);
    res.sendStatus(200);
  }
});

// POST /api/v1/webhooks/garmin/hrv
garminWebhookRouter.post("/hrv", async (req, res) => {
  console.log("HRV Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.hrvSummaries ||
      (Array.isArray(req.body) ? req.body : [req.body]);

    for (const item of payload) {
      const providerUserId = item.userId;
      if (!providerUserId) continue;

      const r = await db.query(
        `SELECT user_id FROM app.user_integrations
         WHERE provider = 'garmin' AND provider_user_id = $1`,
        [providerUserId],
      );

      if (r.rowCount === 0) continue;

      const row = mapGarminHrvToRow(r.rows[0].user_id, item);
      await upsertGarminHrv(row);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin HRV webhook failed:", err);
    res.sendStatus(200);
  }
});


// POST /api/v1/webhooks/garmin/skin_temp
garminWebhookRouter.post("/skin_temp", async (req, res) => {
  console.log("Skin Temp Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.skinTempSummaries ||
      (Array.isArray(req.body) ? req.body : [req.body]);
    for (const item of payload) {
      const providerUserId = item.userId;
      if (!providerUserId) continue;
      const r = await db.query(
        `SELECT user_id FROM app.user_integrations
         WHERE provider = 'garmin' AND provider_user_id = $1`,
        [providerUserId],
      );

      if (r.rowCount === 0) continue;
      const row = mapGarminSkinTempToRow(r.rows[0].user_id, item);
      await upsertGarminSkinTemp(row);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Skin Temp webhook failed:", err);
    res.sendStatus(200);
  }
});

// POST /api/v1/webhooks/garmin/sleeps
garminWebhookRouter.post("/sleeps", async (req, res) => {
  console.log("Sleeps Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.sleepSummaries ||
      (Array.isArray(req.body) ? req.body : [req.body]);

    for (const item of payload) {
      const providerUserId = item.userId;
      if (!providerUserId) continue;

      const r = await db.query(
        `SELECT user_id FROM app.user_integrations
         WHERE provider = 'garmin' AND provider_user_id = $1`,
        [providerUserId],
      );

      if (r.rowCount === 0) continue;

      const row = mapGarminSleepToRow(r.rows[0].user_id, item);
      await upsertGarminSleep(row);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Sleep webhook failed:", err);
    res.sendStatus(200);
  }
});

export default garminWebhookRouter;
