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
import { mapGarminHrvToRow, upsertGarminHrv } from "../../db/garmin/hrv.js";
import {
  mapGarminSkinTempToRow,
  upsertGarminSkinTemp,
} from "../../db/garmin/skinTemp.js";
import {
  mapGarminSleepToRow,
  upsertGarminSleep,
} from "../../db/garmin/sleep.js";
import {
  mapGarminStressToRow,
  upsertGarminStress,
} from "../../db/garmin/stress.js";
import {
  mapGarminRespirationToRow,
  upsertGarminRespiration,
} from "../../db/garmin/respiration.js";
import {
  mapGarminBodyCompToRow,
  upsertGarminBodyComp,
} from "../../db/garmin/bodyComp.js";
import {
  mapGarminActivityToRow,
  upsertGarminActivity,
} from "../../db/garmin/activities.js";
import {
  mapGarminMoveIQToRow,
  upsertGarminMoveIQ,
} from "../../db/garmin/moveIQ.js";

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
    
    console.log("Extracted payload array length:", Array.isArray(payload) ? payload.length : "Not an array");
    console.log("Payload items:", JSON.stringify(payload, null, 2));

    for (const item of payload) {
      const providerUserId = item.userId;
      console.log("Processing Garmin user:", providerUserId);
      
      if (!providerUserId) {
        console.warn("No userId found in sleep item:", JSON.stringify(item, null, 2));
        continue;
      }

      const r = await db.query(
        `SELECT user_id FROM app.user_integrations
         WHERE provider = 'garmin' AND provider_user_id = $1`,
        [providerUserId],
      );

      console.log("Found internal user:", r.rows[0]?.user_id);

      if (r.rowCount === 0) {
        console.warn("Garmin user not linked:", providerUserId);
        continue;
      }

      const row = mapGarminSleepToRow(r.rows[0].user_id, item);
      console.log("Mapped sleep row:", JSON.stringify(row, null, 2));
      
      await upsertGarminSleep(row);
      console.log("Successfully upserted sleep data for user:", r.rows[0].user_id);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Sleep webhook failed:", err);
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
    res.sendStatus(200);
  }
});

// POST /api/v1/webhooks/garmin/stress
garminWebhookRouter.post("/stress", async (req, res) => {
  console.log("Stress Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));
  try {
    const payload =
      req.body.stressSummaries ||
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
      const row = mapGarminStressToRow(r.rows[0].user_id, item);
      await upsertGarminStress(row);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Stress webhook failed:", err);
    res.sendStatus(200);
  }
});

// POST /api/v1/webhooks/garmin/respiration
garminWebhookRouter.post("/respiration", async (req, res) => {
  console.log("Respiration Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.respirationSummaries ||
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

      const row = mapGarminRespirationToRow(r.rows[0].user_id, item);
      await upsertGarminRespiration(row);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Respiration webhook failed:", err);
    res.sendStatus(200);
  }
});

// POST /api/v1/webhooks/garmin/body_comp
garminWebhookRouter.post("/body_comp", async (req, res) => {
  console.log("Body Comp Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.bodyCompositionSummaries ||
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

      const row = mapGarminBodyCompToRow(r.rows[0].user_id, item);
      await upsertGarminBodyComp(row);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Body Comp webhook failed:", err);
    res.sendStatus(200);
  }
});

// POST /api/v1/webhooks/garmin/activities
garminWebhookRouter.post("/activities", async (req, res) => {
  console.log("Activities Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.activities || (Array.isArray(req.body) ? req.body : [req.body]);

    for (const item of payload) {
      const providerUserId = item.userId;
      if (!providerUserId) continue;

      const r = await db.query(
        `SELECT user_id FROM app.user_integrations
         WHERE provider = 'garmin' AND provider_user_id = $1`,
        [providerUserId],
      );

      if (r.rowCount === 0) continue;

      const row = mapGarminActivityToRow(r.rows[0].user_id, item);
      await upsertGarminActivity(row);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Activities webhook failed:", err);
    res.sendStatus(200);
  }
});

// POST /api/v1/webhooks/garmin/move_iq
garminWebhookRouter.post("/move_iq", async (req, res) => {
  console.log("Move IQ Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.moveIQActivities ||
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

      const row = mapGarminMoveIQToRow(r.rows[0].user_id, item);
      await upsertGarminMoveIQ(row);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Move IQ webhook failed:", err);
    res.sendStatus(200);
  }
});

export default garminWebhookRouter;
