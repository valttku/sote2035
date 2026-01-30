import express from "express";
import { buildGarminAuthUrl } from "./garmin-oauth/garminAuthUrl.js";
import { consumeOAuthState } from "./garmin-oauth/stateStore.js";
import { exchangeGarminCodeForToken } from "./garmin-oauth/garminToken.js";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";

export const garminRouter = express.Router();

// Router for Garmin integration, doesn't work with localhost due to Garmin restrictions

// GET /api/v1/integrations/garmin/connect
garminRouter.get("/connect", authRequired, (req, res) => {
  const userId = (req as any).userId as number;
  const url = buildGarminAuthUrl(userId);
  res.redirect(url);
});

// GET /api/v1/integrations/garmin/callback
garminRouter.get("/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    console.error("Callback missing code or state:", req.query);
    return res.status(400).json({ error: "Missing code or state" });
  }

  try {
    // Consume the saved state to get userId and PKCE verifier
    const stateData = await consumeOAuthState(state);
    if (!stateData) {
      console.error("Invalid or expired state:", state);
      return res.status(400).json({ error: "Invalid or expired state" });
    }

    const { verifier, userId } = stateData;

    // Exchange code for token
    const token = await exchangeGarminCodeForToken(code, verifier);

    console.log("Garmin token response:", token);

    // 4Save user integration
    await db.query("BEGIN");

    await db.query(
      `
  INSERT INTO app.user_integrations
    (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at)
  VALUES
    ($1, 'garmin', $2, $3, $4, $5)
  ON CONFLICT (user_id, provider)
  DO UPDATE SET
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    token_expires_at = excluded.token_expires_at,
    updated_at = NOW()
  `,
      [
        userId,
        token.user_id ?? null,
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

    console.log(`Garmin account linked for user ${userId}`);
    res.redirect(`${process.env.APP_BASE_URL}/`); // Or return JSON if preferred
  } catch (err: any) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("Garmin callback error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Garmin token exchange failed",
      details: err.response?.data || err.message,
    });
  }
});

export default garminRouter;
