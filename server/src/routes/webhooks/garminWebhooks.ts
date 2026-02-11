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
  mapGarminRespirationToRow,
  upsertGarminRespiration,
} from "../../db/garmin/respiration.js";
import {
  mapGarminActivityToRow,
  upsertGarminActivity,
} from "../../db/garmin/activities.js";
import { mapGarminBodyCompToRow,
  upsertGarminBodyComp,
} from "../../db/garmin/bodyComp.js";

export const garminWebhookRouter = express.Router();

garminWebhookRouter.post("/user-metrics", async (req, res) => {
  console.log("Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    // Handle array wrapped by summary type
    const payload =
      req.body.userMetrics || (Array.isArray(req.body) ? req.body : [req.body]);

    console.log(
      "Extracted payload array length:",
      Array.isArray(payload) ? payload.length : "Not an array",
    );
    console.log("Payload items:", JSON.stringify(payload, null, 2));

    for (const item of payload) {
      const providerUserId = item.userId;
      console.log("Processing Garmin user:", providerUserId);
      if (!providerUserId) {
        console.warn(
          "No userId found in user-metrics item:",
          JSON.stringify(item, null, 2),
        );
        continue;
      }

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
      console.log(
        "Successfully upserted user metrics for user:",
        r.rows[0].user_id,
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin webhook failed:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );
    res.sendStatus(200);
  }
});

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

garminWebhookRouter.post("/respiration", async (req, res) => {
  console.log("Respiration Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.allDayRespiration ||
      req.body.respirationSummaries ||
      (Array.isArray(req.body) ? req.body : [req.body]);

    console.log(
      "Extracted payload array length:",
      Array.isArray(payload) ? payload.length : "Not an array",
    );
    console.log("Payload items:", JSON.stringify(payload, null, 2));

    for (const item of payload) {
      const providerUserId = item.userId;
      console.log("Processing Garmin user:", providerUserId);

      if (!providerUserId) {
        console.warn(
          "No userId found in respiration item:",
          JSON.stringify(item, null, 2),
        );
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

      const row = mapGarminRespirationToRow(r.rows[0].user_id, item);
      console.log("Mapped respiration row:", JSON.stringify(row, null, 2));

      await upsertGarminRespiration(row);
      console.log(
        "Successfully upserted respiration data for user:",
        r.rows[0].user_id,
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Respiration webhook failed:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );
    res.sendStatus(200);
  }
});

garminWebhookRouter.post("/body_comp", async (req, res) => {
  console.log("Body Comp Webhook received at:", new Date().toISOString());
  console.log("Payload:", JSON.stringify(req.body, null, 2));

  try {
    const payload =
      req.body.bodyCompositionSummaries ||
      (Array.isArray(req.body) ? req.body : [req.body]);

    console.log(
      "Extracted payload array length:",
      Array.isArray(payload) ? payload.length : "Not an array",
    );
    console.log("Payload items:", JSON.stringify(payload, null, 2));

    for (const item of payload) {
      const providerUserId = item.userId;
      console.log("Processing Garmin user:", providerUserId);

      if (!providerUserId) {
        console.warn(
          "No userId found in body_comp item:",
          JSON.stringify(item, null, 2),
        );
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

      const row = mapGarminBodyCompToRow(r.rows[0].user_id, item);
      console.log("Mapped body_comp row:", JSON.stringify(row, null, 2));

      await upsertGarminBodyComp(row);
      console.log(
        "Successfully upserted body_comp data for user:",
        r.rows[0].user_id,
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Body Comp webhook failed:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );
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


export default garminWebhookRouter;
