import express from "express";
import { buildGarminAuthUrl } from "./garmin-oauth/garminAuthUrl.js";
import { consumeOAuthState } from "./garmin-oauth/stateStore.js";
import { exchangeGarminCodeForToken } from "./garmin-oauth/garminToken.js";
import { fetchGarminUserProfile } from "./garmin-oauth/garminToken.js";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";

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

    res.redirect(`${process.env.GARMIN_REDIRECT_AFTER_LINK || "/"}/`);
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

// GET /api/v1/integrations/garmin/pull
garminRouter.get("/pull", async (req, res) => {
  try {
    // 1. Get a Garmin access token from DB (pick one user for now)
    const r = await db.query(
      `SELECT access_token
   FROM app.user_integrations
   WHERE provider = 'garmin' AND user_id = $1`,
      [7],
    );

    if (r.rowCount === 0) {
      return res.status(400).json({ error: "No Garmin access token found" });
    }

    const accessToken = r.rows[0].access_token;

    // 2. Define time range (last 1 year)
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 60 * 60 * 24 * 365;

    // 3. Call Garmin BACKFILL endpoint (OAuth required)
    const response = await fetch(
      `https://apis.garmin.com/wellness-api/rest/backfill/userMetrics` +
        `?summaryStartTimeInSeconds=${oneYearAgo}` +
        `&summaryEndTimeInSeconds=${now}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    const text = await response.text();

    // 4. Log EVERYTHING so it appears in Render
    console.log("Garmin backfill status:", response.status);
    console.log("Garmin backfill raw response:", text);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Garmin API error", body: text });
    }

    const data = JSON.parse(text);

    console.log("Garmin backfill parsed JSON:", data);

    // 5. Respond to browser
    res.json({
      ok: true,
      metricsCount: data.userMetrics?.length ?? 0,
      data,
    });
  } catch (err: any) {
    console.error("Garmin pull failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default garminRouter;
