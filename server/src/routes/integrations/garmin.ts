import express from "express";
import { buildGarminAuthUrl } from "./garmin-oauth/garminAuthUrl.js";
import { consumeOAuthState } from "./garmin-oauth/stateStore.js";
import { exchangeGarminCodeForToken } from "./garmin-oauth/garminToken.js";
import { fetchGarminUserProfile } from "./garmin-oauth/garminToken.js";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";
import {
  mapGarminSleepToRow,
  upsertGarminSleep,
} from "../../db/garmin/sleep.js";
import {
  mapGarminRespirationToRow,
  upsertGarminRespiration,
} from "../../db/garmin/respiration.js";
import {
  mapGarminStressToRow,
  upsertGarminStress,
} from "../../db/garmin/stress.js";
import {
  mapGarminBodyCompToRow,
  upsertGarminBodyComp,
} from "../../db/garmin/bodyComp.js";
import {
  mapGarminSkinTempToRow,
  upsertGarminSkinTemp,
} from "../../db/garmin/skinTemp.js";
import { mapGarminHrvToRow, upsertGarminHrv } from "../../db/garmin/hrv.js";
import {
  mapGarminDailiesToRows,
  upsertGarminDailies,
} from "../../db/garmin/dailies.js";
import {
  mapGarminUserMetricsToRows,
  upsertGarminUserMetrics,
} from "../../db/garmin/metrics.js";
import {
  mapGarminActivityToRow,
  upsertGarminActivity,
} from "../../db/garmin/activities.js";
import {
  mapGarminMoveIQToRow,
  upsertGarminMoveIQ,
} from "../../db/garmin/moveIQ.js";

// Router for Garmin integration endpoints

export const garminRouter = express.Router();

// GET /api/v1/integrations/garmin/status
garminRouter.get("/status", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const r = await db.query(
      `SELECT provider_user_id, created_at, updated_at
       FROM app.user_integrations
       WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );
    if (r.rowCount === 0) {
      return res.json({ linked: false });
    }
    const row = r.rows[0] as {
      provider_user_id: string | null;
      created_at: string;
      updated_at: string;
    };
    return res.json({
      linked: true,
      provider_user_id: row.provider_user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/v1/integrations/garmin/unlink
garminRouter.delete("/unlink", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    await db.query(
      `DELETE FROM app.user_integrations WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );
    await db.query(
      `UPDATE app.users SET active_provider = NULL WHERE id = $1 AND active_provider = 'garmin'`,
      [userId],
    );
    res.json({ message: "Unlinked" });
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/integrations/garmin/connect
garminRouter.get("/connect", authRequired, async (req, res) => {
  const userId = (req as any).userId as number;
  const url = await buildGarminAuthUrl(userId);
  res.redirect(url);
});

// GET /api/v1/integrations/garmin/callback
// Callback
garminRouter.get("/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state)
    return res.status(400).json({ error: "Missing code/state" });

  try {
    const stateData = await consumeOAuthState(state);
    if (!stateData)
      return res.status(400).json({ error: "Invalid/expired state" });

    const { verifier, userId } = stateData;
    const token = await exchangeGarminCodeForToken(code, verifier);

    // fetch Garmin user profile for Garmin user ID
    const userProfile = await fetchGarminUserProfile(token.access_token);
    const garminUserId = userProfile.userId ?? null;

    await db.query("BEGIN");
    await db.query(
      `
      INSERT INTO app.user_integrations
        (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at)
      VALUES ($1, 'garmin', $2, $3, $4, $5)
      ON CONFLICT (user_id, provider) DO UPDATE
        SET access_token = excluded.access_token,
            refresh_token = excluded.refresh_token,
            token_expires_at = excluded.token_expires_at,
            updated_at = NOW()
      `,
      [
        userId,
        garminUserId,
        token.access_token,
        token.refresh_token ?? null,
        token.expires_in
          ? new Date(Date.now() + token.expires_in * 1000)
          : null,
      ],
    );
    await db.query(
      `UPDATE app.users SET active_provider = 'garmin' WHERE id = $1`,
      [userId],
    );
    await db.query("COMMIT");

    // determine redirect URL
    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? process.env.APP_BASE_URL || "https://sote2035-client.onrender.com" // deployed frontend URL
        : "http://localhost:3000"; // local frontend URL

    res.redirect(redirectUrl);
  } catch (err: any) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("Garmin callback error:", err.message || err);
    res.status(500).json({ error: "Garmin integration failed" });
  }
});

//  temporary test route to get user id from Garmin API
garminRouter.get("/test-profile", async (req, res) => {
  try {
    const userId = 7; // test user
    const r = await db.query(
      `SELECT access_token FROM app.user_integrations WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );
    if (r.rowCount === 0) return res.status(400).send("No token");

    const accessToken = r.rows[0].access_token;

    const resp = await fetch(
      "https://apis.garmin.com/wellness-api/rest/user/id",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).send(`Garmin API failed: ${text}`);
    }

    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    console.error("Test route error:", err);
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// POST /api/v1/integrations/garmin/sync-now
garminRouter.post("/sync-now", authRequired, async (req, res) => {
  try {
    const userId = (req as any).userId as number;
    const r = await db.query(
      `SELECT access_token FROM app.user_integrations WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );
    if (r.rowCount === 0) {
      return res.status(400).json({ error: "Garmin not linked" });
    }
    const accessToken = r.rows[0].access_token;

    const results = {
      sleeps: 0,
      respiration: 0,
      stress: 0,
      bodyComp: 0,
      skinTemp: 0,
      hrv: 0,
      userMetrics: 0,
      dailies: 0,
      activities: 0,
      moveIQ: 0,
      errors: [] as string[],
    };

    const GARMIN_API_BASE =
      "https://apis.garmin.com/wellness-api/rest/backfill";
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Helper function to fetch and process data
    const syncDataType = async (
      endpoint: string,
      arrayKey: string,
      mapper: (user_id: number, item: any) => any,
      upsert: (row: any) => Promise<void>,
      resultKey: string,
    ) => {
      try {
        console.log(`Syncing ${endpoint}...`);
        const response = await fetch(`${GARMIN_API_BASE}${endpoint}`, {
          headers,
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Garmin API error: ${response.status} ${text}`);
        }
        const data = await response.json();
        const items = data[arrayKey] || [];
        let count = 0;
        for (const item of items) {
          const row = mapper(userId, item);
          await upsert(row);
          count++;
        }
        console.log(`  ✓ Synced ${count} ${endpoint} records`);
        (results as any)[resultKey] = count;
      } catch (err: any) {
        const msg = `Failed to sync ${endpoint}: ${err.message}`;
        console.error(msg);
        results.errors.push(msg);
      }
    };

    // Special handler for /userMetrics which returns both userMetrics and dailies
    const syncUserMetrics = async () => {
      try {
        console.log("Syncing /userMetrics...");
        const response = await fetch(`${GARMIN_API_BASE}/userMetrics`, {
          headers,
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Garmin API error: ${response.status} ${text}`);
        }
        const data = await response.json();

        // Process userMetrics
        const metrics = data.userMetrics || [];
        for (const item of metrics) {
          const row = mapGarminUserMetricsToRows(userId, item);
          await upsertGarminUserMetrics(row);
        }
        results.userMetrics = metrics.length;
        console.log(`  ✓ Synced ${metrics.length} userMetrics records`);

        // Process dailies (if available in same response)
        const dailies = data.dailies || data.summaries || [];
        for (const item of dailies) {
          const row = mapGarminDailiesToRows(userId, item);
          await upsertGarminDailies(row);
        }
        results.dailies = dailies.length;
        if (dailies.length > 0) {
          console.log(`  ✓ Synced ${dailies.length} dailies records`);
        }
      } catch (err: any) {
        const msg = `Failed to sync /userMetrics: ${err.message}`;
        console.error(msg);
        results.errors.push(msg);
      }
    };

    // Execute all syncs in parallel
    await Promise.all([
      syncDataType(
        "/sleeps",
        "sleeps",
        mapGarminSleepToRow,
        upsertGarminSleep,
        "sleeps",
      ),
      syncDataType(
        "/respiration",
        "allDayRespiration",
        mapGarminRespirationToRow,
        upsertGarminRespiration,
        "respiration",
      ),
      syncDataType(
        "/stress",
        "stress",
        mapGarminStressToRow,
        upsertGarminStress,
        "stress",
      ),
      syncDataType(
        "/bodyComposition",
        "bodyComposition",
        mapGarminBodyCompToRow,
        upsertGarminBodyComp,
        "bodyComp",
      ),
      syncDataType(
        "/skinTemperature",
        "skinTemp",
        mapGarminSkinTempToRow,
        upsertGarminSkinTemp,
        "skinTemp",
      ),
      syncDataType("/hrv", "hrv", mapGarminHrvToRow, upsertGarminHrv, "hrv"),
      syncUserMetrics(),
      syncDataType(
        "/activities",
        "activities",
        mapGarminActivityToRow,
        upsertGarminActivity,
        "activities",
      ),
      syncDataType(
        "/moveIQ",
        "moveIQ",
        mapGarminMoveIQToRow,
        upsertGarminMoveIQ,
        "moveIQ",
      ),
    ]);

    res.json({
      message: "Sync completed",
      results,
    });
  } catch (err: any) {
    console.error("Sync now error:", err);
    res.status(500).json({ error: "Failed to trigger sync" });
  }
});

export default garminRouter;
