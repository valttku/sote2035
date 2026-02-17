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
import {
  mapGarminActivityToRow,
  upsertGarminActivity,
} from "../../db/garmin/activitiesDb.js";

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
      `SELECT access_token, refresh_token, token_expires_at
       FROM app.user_integrations
       WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );

    if (r.rowCount === 0) {
      return res.status(400).json({ error: "Garmin not linked" });
    }

    let { access_token, refresh_token, token_expires_at } = r.rows[0];

    // ---- Token refresh ----
    const nowMs = Date.now();
    const expiresAt = token_expires_at
      ? new Date(token_expires_at).getTime()
      : 0;

    if ((!access_token || expiresAt <= nowMs + 60_000) && refresh_token) {
      const tokenResp = await refreshGarminToken(refresh_token);

      access_token = tokenResp.access_token;
      refresh_token = tokenResp.refresh_token ?? refresh_token;

      const expiresIn =
        typeof tokenResp.expires_in === "number" ? tokenResp.expires_in : null;

      const newExpires = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

      await db.query(
        `UPDATE app.user_integrations
         SET access_token = $1,
             refresh_token = $2,
             token_expires_at = $3,
             updated_at = NOW()
         WHERE user_id = $4 AND provider = 'garmin'`,
        [access_token, refresh_token, newExpires, userId],
      );
    }

    if (!access_token) {
      return res.status(400).json({ error: "No valid access token" });
    }

    // ---- Yesterday UTC window ----
    const now = new Date();
    const yesterday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1,
        0,
        0,
        0,
      ),
    );

    const startSeconds = Math.floor(yesterday.getTime() / 1000);
    const endSeconds = startSeconds + 86400 - 1;

    const GARMIN_API_BASE = "https://apis.garmin.com/wellness-api/rest";

    const url =
      `${GARMIN_API_BASE}/backfill/activities` +
      `?summaryStartTimeInSeconds=${startSeconds}` +
      `&summaryEndTimeInSeconds=${endSeconds}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const rawBody = await response.text().catch(() => "");

    if (!response.ok && response.status !== 409) {
      console.error("Garmin backfill failed:", rawBody);
      return res
        .status(502)
        .json({ error: "Backfill failed", details: rawBody });
    }

    let backfillStatus = "";
    if (response.status === 200) {
      backfillStatus = "Backfill accepted by Garmin";
    } else if (response.status === 409) {
      backfillStatus = "Backfill already exists / duplicate";
    }

    return res.json({
      message: backfillStatus,
      window: { startSeconds, endSeconds },
      status: response.status,
      responseBody: rawBody, // optional, for testing
    });
  } catch (err) {
    console.error("Garmin sync-now failed:", err);
    return res.status(500).json({ error: "Sync failed" });
  }
});

export default garminRouter;
