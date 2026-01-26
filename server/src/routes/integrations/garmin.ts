import { Router } from "express";
import crypto from "crypto";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";

export const garminRouter = Router();

// Linking garmin doesnt work on localhost due to Garmin restrictions

const CLIENT_ID = process.env.GARMIN_CLIENT_ID ?? "";
const REDIRECT_URI =
  process.env.GARMIN_REDIRECT_URI ??
  "http://localhost:4000/api/v1/integrations/garmin/callback";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

function mustEnv(name: string, value: string) {
  if (!value) throw new Error(`${name} is required`);
}

// Utility to generate a PKCE code challenge from a code verifier
function base64URLEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sha256(buffer: string) {
  return crypto.createHash("sha256").update(buffer).digest();
}

// GET /api/v1/integrations/garmin/status
garminRouter.get("/status", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;
    const r = await db.query(
      `
      SELECT provider_user_id, created_at, updated_at
      FROM app.user_integrations
      WHERE user_id = $1 AND provider = 'garmin'
      `,
      [userId],
    );

    if (r.rowCount === 0) return res.json({ linked: false });

    res.json({
      linked: true,
      provider_user_id: r.rows[0].provider_user_id,
      created_at: r.rows[0].created_at,
      updated_at: r.rows[0].updated_at,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/integrations/garmin/connect
garminRouter.get("/connect", authRequired, async (req, res, next) => {
  try {
    mustEnv("GARMIN_CLIENT_ID", CLIENT_ID);
    mustEnv("GARMIN_REDIRECT_URI", REDIRECT_URI);

    const userId = (req as any).userId as number;

    const codeVerifier = crypto.randomBytes(64).toString("hex");
    const state = crypto.randomUUID();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.query(
      `INSERT INTO app.oauth_states (state, user_id, expires_at, code_verifier)
       VALUES ($1, $2, $3, $4)`,
      [state, userId, expires, codeVerifier],
    );

    const codeChallenge = base64URLEncode(sha256(codeVerifier));

    const url = new URL("https://connect.garmin.com/partner/oauth2Confirm");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    res.redirect(url.toString());
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/integrations/garmin/callback
garminRouter.get("/callback", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (!code || !state) {
      return res.status(400).json({
        error: "Missing code or state from Garmin. Authentication failed.",
      });
    }

    // Retrieve code_verifier from DB
    const st = await db.query(
      `SELECT user_id, code_verifier, expires_at FROM app.oauth_states WHERE state = $1`,
      [state],
    );

    if (st.rowCount === 0) {
      return res.status(400).json({
        error: "Invalid or unknown state. Authentication failed.",
      });
    }

    const { user_id, code_verifier, expires_at } = st.rows[0] as {
      user_id: number;
      code_verifier: string;
      expires_at: string;
    };

    if (new Date(expires_at).getTime() < Date.now()) {
      await db.query(`DELETE FROM app.oauth_states WHERE state = $1`, [state]);
      return res.status(400).json({
        error: "State expired. Please try logging in again.",
      });
    }

    await db.query(`DELETE FROM app.oauth_states WHERE state = $1`, [state]);

    try {
      const authHeader = Buffer.from(`${CLIENT_ID}:`).toString("base64");

      const tokenRes = await fetch(
        "https://connectapi.garmin.com/oauth-service/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${authHeader}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier,
          }),
        },
      );

      const text = await tokenRes.text();
      console.log("Garmin raw token response:", text);
      console.log("Garmin token response status:", tokenRes.status);
      console.log("Generated PKCE state:", state);
      console.log("Callback received state:", state);

      let tokenJson;
      try {
        tokenJson = JSON.parse(text);
      } catch {
        tokenJson = { raw: text }; // send raw text if JSON parse fails
      }

      if (!tokenRes.ok) {
        // Return Garmin's error directly
        return res.status(tokenRes.status).json({
          error: "Garmin token exchange failed",
          details: tokenJson,
        });
      }

      const accessToken = tokenJson.access_token;
      const refreshToken = tokenJson.refresh_token;
      const expiresIn = tokenJson.expires_in;
      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

      // Retrieve Garmin user ID
      const profileRes = await fetch(
        "https://gcpsapi-cv1.garmin.com/partner-gateway/rest/user/id",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const profileJson: any = await profileRes.json();
      const garminUserId = profileJson.userId ?? null;

      // Save to DB
      await db.query("BEGIN");
      await db.query(
        `
        INSERT INTO app.user_integrations
          (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at)
        VALUES
          ($1, 'garmin', $2, $3, $4, $5)
        ON CONFLICT (user_id, provider)
        DO UPDATE SET
          provider_user_id = excluded.provider_user_id,
          access_token = excluded.access_token,
          refresh_token = excluded.refresh_token,
          token_expires_at = excluded.token_expires_at,
          updated_at = NOW()
        `,
        [user_id, garminUserId, accessToken, refreshToken, tokenExpiresAt],
      );
      await db.query(
        `UPDATE app.users SET active_provider = 'garmin' WHERE id = $1`,
        [user_id],
      );
      await db.query("COMMIT");

      // Success message
      res.json({ message: "Garmin connected successfully" });
    } catch (err: any) {
      console.error("Garmin authentication error:", err);

      await db.query("ROLLBACK").catch(() => {});

      // Send the real error back to the client
      res.status(500).json({
        error: "Garmin authentication failed",
        details: err.message || err,
        note: "Most likely fails on localhost because Garmin requires a public URL.",
      });
    }
  } catch (e) {
    await db.query("ROLLBACK").catch(() => {});
    next(e);
  }
});

// DELETE /api/v1/integrations/garmin/unlink
garminRouter.delete("/unlink", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;

    const integ = await db.query(
      `SELECT provider_user_id, access_token FROM app.user_integrations WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );

    if (integ.rowCount === 0) return res.json({ message: "Not linked" });

    await db.query("BEGIN");
    await db.query(
      `DELETE FROM app.user_integrations WHERE user_id = $1 AND provider = 'garmin'`,
      [userId],
    );
    await db.query(
      `UPDATE app.users SET active_provider = NULL WHERE id = $1 AND active_provider = 'garmin'`,
      [userId],
    );
    await db.query("COMMIT");

    res.json({ message: "Unlinked" });
  } catch (e) {
    await db.query("ROLLBACK").catch(() => {});
    next(e);
  }
});
