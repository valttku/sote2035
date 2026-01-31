import express from "express";
import { buildGarminAuthUrl } from "./garmin-oauth/garminAuthUrl.js";
import { consumeOAuthState } from "./garmin-oauth/stateStore.js";
import { exchangeGarminCodeForToken } from "./garmin-oauth/garminToken.js";
import { fetchGarminUserProfile } from "./garmin-oauth/garminToken.js";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";

export const garminRouter = express.Router();

// Router for Garmin integration, doesn't work with localhost due to Garmin restrictions

// Allowed origins for return_to (avoid open redirect): APP_BASE_URL origin or localhost
function isAllowedReturnTo(returnTo: string): boolean {
  try {
    const u = new URL(returnTo);
    const appBase = process.env.APP_BASE_URL;
    if (appBase) {
      const appOrigin = new URL(appBase).origin;
      if (u.origin === appOrigin) return true;
    }
    if (u.hostname === "localhost" && (u.protocol === "http:" || u.protocol === "https:"))
      return true;
    return false;
  } catch {
    return false;
  }
}

// GET /api/v1/integrations/garmin/connect?return_to=...
garminRouter.get("/connect", authRequired, async (req, res) => {
  const userId = (req as any).userId as number;
  const returnToRaw = typeof req.query.return_to === "string" ? req.query.return_to : undefined;
  const returnTo =
    returnToRaw && isAllowedReturnTo(returnToRaw) ? returnToRaw : undefined;
  const url = await buildGarminAuthUrl(userId, returnTo);
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

    const { verifier, userId, returnTo } = stateData;
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

    // Redirect after link: GARMIN_REDIRECT_AFTER_LINK if set (e.g. http://localhost:3000), else return_to, else APP_BASE_URL (same as Polar)
    const override = process.env.GARMIN_REDIRECT_AFTER_LINK;
    let redirectUrl: string;
    if (override && isAllowedReturnTo(override)) {
      redirectUrl = override.replace(/\/$/, "") || override;
    } else if (returnTo && isAllowedReturnTo(returnTo)) {
      redirectUrl = returnTo;
    } else {
      redirectUrl = process.env.APP_BASE_URL
        ? `${process.env.APP_BASE_URL.replace(/\/$/, "")}/`
        : "/";
    }
    res.redirect(redirectUrl);
  } catch (err: any) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("Garmin callback error:", err.message || err);
    res.status(500).json({ error: "Garmin integration failed" });
  }
});

export default garminRouter;
