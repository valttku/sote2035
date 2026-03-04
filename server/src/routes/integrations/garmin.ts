import express from "express";
import { buildGarminAuthUrl } from "./garmin-oauth/garminAuthUrl.js";
import { consumeOAuthState } from "./garmin-oauth/stateStore.js";
import { exchangeGarminCodeForToken } from "./garmin-oauth/garminToken.js";
import { refreshGarminToken } from "./garmin-oauth/garminToken.js";
import { fetchGarminUserProfile } from "./garmin-oauth/garminToken.js";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";

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

// GET /api/v1/integrations/garmin/connect
garminRouter.get("/connect", authRequired, async (req, res) => {
  const userId = (req as any).userId as number;
  const url = await buildGarminAuthUrl(userId);
  res.redirect(url);
});

// GET /api/v1/integrations/garmin/callback
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

garminRouter.delete("/unlink", authRequired, async (req, res, next) => {
  const userId = (req as any).userId as number;

  await db.query("BEGIN");

  try {
    const tokenResult = await db.query(
      `SELECT access_token, refresh_token
       FROM app.user_integrations
       WHERE user_id = $1 AND provider = 'garmin'
       FOR UPDATE`,
      [userId],
    );

    if (tokenResult.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Garmin not linked" });
    }

    let { access_token, refresh_token } = tokenResult.rows[0];

    const attemptDeregister = async (token: string) => {
      return fetch(
        "https://apis.garmin.com/wellness-api/rest/user/registration",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
    };

    let deregResponse = await attemptDeregister(access_token);

    // If expired → refresh and retry once
    if (deregResponse.status === 401 && refresh_token) {
      console.log("Access token expired. Refreshing...");

      const refreshed = await refreshGarminToken(refresh_token);

      access_token = refreshed.access_token;
      refresh_token = refreshed.refresh_token ?? refresh_token;

      // Store new tokens
      await db.query(
        `UPDATE app.user_integrations
         SET access_token = $1,
             refresh_token = $2
         WHERE user_id = $3 AND provider = 'garmin'`,
        [access_token, refresh_token, userId],
      );

      deregResponse = await attemptDeregister(access_token);
    }

    if (!deregResponse.ok) {
      const text = await deregResponse.text();
      console.error("Garmin deregistration failed:", text);
      await db.query("ROLLBACK");
      return res.status(500).json({ message: "Failed to deregister from Garmin" });
    }

    // Only delete local integration if Garmin confirmed deregistration
    await db.query(
      `DELETE FROM app.user_integrations
       WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );

    await db.query(
      `UPDATE app.users
       SET active_provider = NULL
       WHERE id = $1 AND active_provider = 'garmin'`,
      [userId],
    );

    await db.query("COMMIT");

    res.json({ message: "Garmin unlinked successfully" });
  } catch (e) {
    await db.query("ROLLBACK");
    next(e);
  }
});