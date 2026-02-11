import express from "express";
import { buildGarminAuthUrl } from "./garmin-oauth/garminAuthUrl.js";
import { consumeOAuthState } from "./garmin-oauth/stateStore.js";
import { exchangeGarminCodeForToken } from "./garmin-oauth/garminToken.js";
import { fetchGarminUserProfile } from "./garmin-oauth/garminToken.js";
import { refreshGarminToken } from "./garmin-oauth/garminToken.js";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";

import {
  mapGarminBodyCompToRow,
  upsertGarminBodyComp,
} from "../../db/garmin/bodyComp.js";
import {
  mapGarminUserMetricsToRows,
  upsertGarminUserMetrics,
} from "../../db/garmin/metrics.js";
import {
  mapGarminSleepToRow,
  upsertGarminSleep,
} from "../../db/garmin/sleep.js";
import {
  mapGarminRespirationToRow,
  upsertGarminRespiration,
} from "../../db/garmin/respiration.js";
import {
  mapGarminActivityToRow,
  upsertGarminActivity,
} from "../../db/garmin/activities.js";

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
      `SELECT access_token, refresh_token, provider_user_id FROM app.user_integrations WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );
    if (r.rowCount === 0) {
      return res.status(400).json({ error: "Garmin not linked" });
    }

    let accessToken = r.rows[0].access_token;
    const refreshToken = r.rows[0].refresh_token;
    const garminUserId = r.rows[0].provider_user_id;

    if (!garminUserId) {
      return res.status(400).json({ error: "Garmin user ID not found" });
    }

    // Helper to refresh token and update database
    const refreshAccessToken = async () => {
      if (!refreshToken) {
        throw new Error("No refresh token available. Please reconnect Garmin.");
      }

      console.log("Refreshing Garmin access token...");
      const newTokens = await refreshGarminToken(refreshToken);
      accessToken = newTokens.access_token;

      // Update database with new tokens
      await db.query(
        `UPDATE app.user_integrations 
         SET access_token = $1, 
             refresh_token = $2,
             token_expires_at = $3,
             updated_at = NOW()
         WHERE user_id = $4 AND provider = 'garmin'`,
        [
          newTokens.access_token,
          newTokens.refresh_token || refreshToken,
          newTokens.expires_in
            ? new Date(Date.now() + newTokens.expires_in * 1000)
            : null,
          userId,
        ],
      );
      console.log("✓ Token refreshed successfully");
    };

    // Helper to make authenticated fetch with automatic token refresh
    const authenticatedFetch = async (
      url: string,
      options: RequestInit = {},
      retry = true,
    ): Promise<Response> => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // If 401 and we have a refresh token, refresh and retry once
      if (response.status === 401 && retry && refreshToken) {
        try {
          await refreshAccessToken();
          // Retry with new token
          return authenticatedFetch(url, options, false);
        } catch (err) {
          console.error("Token refresh failed:", err);
          throw err;
        }
      }

      return response;
    };

    const results = {
      bodyComp: 0,
      metrics: 0,
      sleeps: 0,
      respiration: 0,
      activities: 0,
      errors: [] as string[],
    };

    // Date range: last 7 days for backfill, last 24 hours for daily data
    const endDate = Math.floor(Date.now() / 1000); // Current time in seconds
    const startDate = endDate - 7 * 24 * 60 * 60; // 7 days ago for backfill

    const GARMIN_API_BASE = "https://apis.garmin.com/wellness-api/rest";

    // Helper function to fetch and process data with custom parameters
    const syncDataType = async (
      endpoint: string,
      arrayKey: string,
      mapper: (user_id: number, item: any) => any,
      upsert: (row: any) => Promise<void>,
      resultKey: string,
      customStartDate?: number,
      customEndDate?: number,
      useUploadParams?: boolean,
    ) => {
      try {
        console.log(`Syncing ${endpoint}...`);
        const start = customStartDate ?? startDate;
        const end = customEndDate ?? endDate;

        // Use different parameter names for dailies endpoint
        const startParam = useUploadParams
          ? "uploadStartTimeInSeconds"
          : "summaryStartTimeInSeconds";
        const endParam = useUploadParams
          ? "uploadEndTimeInSeconds"
          : "summaryEndTimeInSeconds";
        const url = `${GARMIN_API_BASE}${endpoint}?${startParam}=${start}&${endParam}=${end}`;

        console.log(`  URL: ${url}`);
        const response = await authenticatedFetch(url, {
          headers: { "Content-Type": "application/json" },
        });

        // Handle 409 Conflict (duplicate backfill) as a success case
        if (response.status === 409) {
          console.log(
            `  ⚠ Duplicate backfill detected for ${endpoint} - skipping (already processed)`,
          );
          (results as any)[resultKey] = 0;
          return;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Garmin API error: ${response.status} ${text}`);
        }

        // Handle empty responses
        const text = await response.text();
        if (!text || text.trim() === "") {
          console.log(`  ⚠ Empty response from ${endpoint}`);
          (results as any)[resultKey] = 0;
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.log(
            `  ⚠ Invalid JSON from ${endpoint}: ${text.substring(0, 100)}`,
          );
          (results as any)[resultKey] = 0;
          return;
        }

        console.log(`  Response keys: ${Object.keys(data).join(", ")}`);
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

    // Execute all syncs in parallel
    await Promise.all([
      syncDataType(
        "/backfill/bodyComps",
        "dateWeightList",
        mapGarminBodyCompToRow,
        upsertGarminBodyComp,
        "bodyComp",
      ),
      syncDataType(
        "/backfill/userMetrics",
        "userMetrics",
        mapGarminUserMetricsToRows,
        upsertGarminUserMetrics,
        "metrics",
      ),
      syncDataType(
        "/backfill/sleeps",
        "sleeps",
        mapGarminSleepToRow,
        upsertGarminSleep,
        "sleeps",
      ),
      syncDataType(
        "/backfill/respiration",
        "allDayRespiration",
        mapGarminRespirationToRow,
        upsertGarminRespiration,
        "respiration",
      ),
      syncDataType(
        "/backfill/activities",
        "activityDetails",
        mapGarminActivityToRow,
        upsertGarminActivity,
        "activities",
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
