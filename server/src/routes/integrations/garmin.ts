import express from "express";
import { buildGarminAuthUrl } from "./garmin-oauth/garminAuthUrl.js";
import { consumeOAuthState } from "./garmin-oauth/stateStore.js";
import { exchangeGarminCodeForToken } from "./garmin-oauth/garminToken.js";
import { fetchGarminUserProfile } from "./garmin-oauth/garminToken.js";
import { refreshGarminToken } from "./garmin-oauth/garminToken.js";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";
import {
  mapGarminDailiesToRows,
  upsertGarminDailies,
} from "../../db/garmin/dailiesDb.js";

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

// POST /api/v1/integrations/garmin/sync-now
garminRouter.post("/sync-now", authRequired, async (req, res) => {
  try {
    const userId = (req as any).userId as number;

    const r = await db.query(
      `SELECT provider_user_id, access_token, refresh_token, token_expires_at
       FROM app.user_integrations
       WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );

    if (r.rowCount === 0) {
      return res.status(400).json({ error: "Garmin not linked" });
    }

    const row = r.rows[0] as {
      provider_user_id: string | null;
      access_token: string | null;
      refresh_token: string | null;
      token_expires_at: string | null;
    };

    let accessToken = row.access_token;
    const refreshToken = row.refresh_token;
    let refreshed = false;

    // If we don't have an access token or it's expired, try to refresh
    const expiresAt = row.token_expires_at
      ? new Date(row.token_expires_at).getTime()
      : 0;
    const now = Date.now();

    if ((!accessToken || expiresAt <= now + 1000 * 60) && refreshToken) {
      try {
        const tokenResp = await refreshGarminToken(refreshToken);
        accessToken = tokenResp.access_token;
        const newRefresh = tokenResp.refresh_token ?? refreshToken;
        const expiresIn =
          typeof tokenResp.expires_in === "number"
            ? tokenResp.expires_in
            : null;
        const tokenExpiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : null;

        await db.query(
          `UPDATE app.user_integrations
           SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
           WHERE user_id = $4 AND provider = 'garmin'`,
          [accessToken, newRefresh, tokenExpiresAt, userId],
        );

        refreshed = true;
      } catch (err) {
        console.error("Garmin token refresh failed:", err);
        return res
          .status(500)
          .json({ error: "Failed to refresh Garmin token" });
      }
    }

    // Validate the access token by fetching the Garmin user profile
    try {
      if (!accessToken)
        return res.status(400).json({ error: "No access token available" });
      await fetchGarminUserProfile(accessToken);
    } catch (err: any) {
      console.error(
        "Garmin access token validation failed:",
        err?.message || err,
      );
      return res.status(500).json({ error: "Garmin token invalid" });
    }

    // We don't perform a full data import here; just report status and token refresh
    // Perform a Garmin backfill for dailies (last 30 days)
    try {
      const GARMIN_API_BASE = "https://apis.garmin.com/wellness-api/rest";
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - 24 * 60 * 60; // last 24 hours

      const backfillUrl = `${GARMIN_API_BASE}/backfill/dailies?summaryStartTimeInSeconds=${startDate}&summaryEndTimeInSeconds=${endDate}`;

      const response = await fetch(backfillUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Handle duplicate-backfill (Garmin returns 409 with a message) as success
      if (response.status === 409) {
        const text = await response.text().catch(() => "");
        console.info("Garmin backfill/dailies duplicate:", text);
        return res.json({
          results: {
            validated: 1,
            refreshed: refreshed ? 1 : 0,
            dailies: 0,
            message: text,
          },
        });
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("Garmin backfill/dailies failed:", response.status, text);
        return res.status(502).json({ error: "Garmin backfill failed" });
      }

      // Some Garmin endpoints may return empty body or non-JSON; handle safely
      const raw = await response.text().catch(() => "");
      let data: any = null;
      if (raw && raw.trim().length > 0) {
        try {
          data = JSON.parse(raw);
        } catch (parseErr) {
          console.warn(
            "Failed to parse Garmin backfill response as JSON:",
            parseErr,
          );
          console.warn("Raw response:", raw.slice(0, 2000));
          data = null;
        }
      }

      // Garmin may return array under a few keys; accept common variants
      const items =
        (data && (data.dailySummaries || data.dailies)) ||
        (Array.isArray(data) ? data : []);

      let dailiesCount = 0;
      for (const item of items) {
        const rows = mapGarminDailiesToRows(userId, item);
        if (rows && rows.length) {
          await upsertGarminDailies(rows);
          dailiesCount += rows.length;
        }
      }

      return res.json({
        results: {
          validated: 1,
          refreshed: refreshed ? 1 : 0,
          dailies: dailiesCount,
        },
      });
    } catch (err) {
      console.error("Garmin dailies backfill failed:", err);
      return res.status(500).json({ error: "Backfill failed" });
    }
  } catch (err) {
    console.error("Garmin sync-now failed:", err);
    return res.status(500).json({ error: "Sync failed" });
  }
});

export default garminRouter;
