import express from "express";
import { db } from "../../db/db.js";
import {
  upsertGarminUserMetrics,
  mapGarminUserMetricsToRows,
} from "../../db/garmin/metricsDb.js";
import {
  upsertGarminDailies,
  mapGarminDailiesToRows,
} from "../../db/garmin/dailiesDb.js";
import {
  mapGarminRespirationToRow,
  upsertGarminRespiration,
} from "../../db/garmin/respirationDb.js";
import {
  mapGarminActivityToRow,
  upsertGarminActivity,
} from "../../db/garmin/activitiesDb.js";
import {
  mapGarminBodyCompToRow,
  upsertGarminBodyComp,
} from "../../db/garmin/bodyCompDb.js";
import {
  mapGarminSleepToRow,
  upsertGarminSleep,
} from "../../db/garmin/sleepDb.js";
import { mapGarminHRVToRows, upsertGarminHRV } from "../../db/garmin/hrvDb.js";

// Router for Garmin webhooks
export const garminWebhookRouter = express.Router();

// https://sote2035-server.onrender.com/api/v1/webhooks/garmin/user-metrics
// POST /api/v1/webhooks/garmin/user-metrics
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

// https://sote2035-server.onrender.com/api/v1/webhooks/garmin/dailies
// POST /api/v1/webhooks/garmin/dailies
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

// https://sote2035-server.onrender.com/api/v1/webhooks/garmin/respiration
// POST /api/v1/webhooks/garmin/respiration
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

// https://sote2035-server.onrender.com/api/v1/webhooks/garmin/body_comp
// POST /api/v1/webhooks/garmin/body_comp
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

// https://sote2035-server.onrender.com/api/v1/webhooks/garmin/activities
// POST /api/v1/webhooks/garmin/activities
garminWebhookRouter.post("/activities", async (req, res) => {
  console.log("Activities Webhook received at:", new Date().toISOString());
  console.log("Raw Payload:", JSON.stringify(req.body, null, 2));

  try {
    // Normalize payload to array
    const payload =
      req.body.activities || (Array.isArray(req.body) ? req.body : [req.body]);

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
          "No userId found in activity item:",
          JSON.stringify(item, null, 2),
        );
        continue;
      }

      const r = await db.query(
        `SELECT user_id FROM app.user_integrations
         WHERE provider = 'garmin' AND provider_user_id = $1`,
        [providerUserId],
      );

      if (r.rowCount === 0) {
        console.warn("Garmin user not linked:", providerUserId);
        continue;
      }

      const user_id = r.rows[0].user_id;
      console.log("Found internal user:", user_id);

      // Map Garmin payload to row object
      const row = mapGarminActivityToRow(user_id, item);
      console.log("Mapped activity row:", JSON.stringify(row, null, 2));

      // Upsert into DB
      await upsertGarminActivity(row);
      console.log(
        `Successfully upserted activity data for user ${user_id}, activity ${row.summary_id}`,
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Activities webhook failed:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );
    res.sendStatus(200);
  }
});

// https://sote2035-server.onrender.com/api/v1/webhooks/garmin/sleeps
// POST /api/v1/webhooks/garmin/sleeps
garminWebhookRouter.post("/sleeps", async (req, res) => {
  console.log("Sleep Webhook received at:", new Date().toISOString());
  console.log("Raw Payload:", JSON.stringify(req.body, null, 2));

  try {
    // Normalize payload to array
    const payload =
      req.body.sleeps || (Array.isArray(req.body) ? req.body : [req.body]);

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
          "No userId found in sleep item:",
          JSON.stringify(item, null, 2),
        );
        continue;
      }

      const r = await db.query(
        `SELECT user_id FROM app.user_integrations
         WHERE provider = 'garmin' AND provider_user_id = $1`,
        [providerUserId],
      );

      if (r.rowCount === 0) {
        console.warn("Garmin user not linked:", providerUserId);
        continue;
      }

      const user_id = r.rows[0].user_id;
      console.log("Found internal user:", user_id);

      // Map Garmin payload to row object
      const row = mapGarminSleepToRow(user_id, item);
      console.log("Mapped sleep row:", JSON.stringify(row, null, 2));

      // Upsert into DB
      await upsertGarminSleep(row);
      console.log(
        `Successfully upserted sleep data for user ${user_id}, day ${row.day_date}`,
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin Sleep webhook failed:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );
    res.sendStatus(200); // Garmin still expects 200
  }
});

// https://sote2035-server.onrender.com/api/v1/webhooks/garmin/hrv
// POST /api/v1/webhooks/garmin/hrv
garminWebhookRouter.post("/hrv", async (req, res) => {
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
      const rows = mapGarminHRVToRows(user_id, item);
      console.log("Mapped row:", rows);

      // Upsert into DB
      if (rows) {
        await upsertGarminHRV(rows);
        console.log("Inserted HRV data");
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Garmin hrv webhook failed:", err);
    res.sendStatus(200);
  }
});

export default garminWebhookRouter;
