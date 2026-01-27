import { Router } from "express";
import crypto from "crypto";
import { authRequired } from "../../middleware/authRequired.js";
import { db } from "../../db/db.js";

export const polarRouter = Router();

const CLIENT_ID = process.env.POLAR_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.POLAR_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.POLAR_REDIRECT_URI ?? "";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

function mustEnv(name: string, value: string) {
  if (!value) throw new Error(`${name} is required`);
}

// GET /api/v1/integrations/polar/status
polarRouter.get("/status", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;

    const r = await db.query(
      `
      select provider_user_id, created_at, updated_at
      from app.user_integrations
      where user_id = $1 and provider = 'polar'
      `,
      [userId]
    );

    if (r.rowCount === 0) {
      return res.json({ linked: false });
    }

    return res.json({
      linked: true,
      provider_user_id: r.rows[0].provider_user_id,
      created_at: r.rows[0].created_at,
      updated_at: r.rows[0].updated_at,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/integrations/polar/connect
polarRouter.get("/connect", authRequired, async (req, res, next) => {
  try {
    mustEnv("POLAR_CLIENT_ID", CLIENT_ID);
    mustEnv("POLAR_REDIRECT_URI", REDIRECT_URI);

    const userId = (req as any).userId as number;

    const state = crypto.randomUUID();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      `insert into app.oauth_states (state, user_id, expires_at)
       values ($1, $2, $3)`,
      [state, userId, expires]
    );

    const url = new URL("https://flow.polar.com/oauth2/authorization");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("state", state);

    res.redirect(url.toString());
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/integrations/polar/callback?code=...&state=...
// NOTE: no authRequired here. We bind the callback to a user via the state row.
polarRouter.get("/callback", async (req, res, next) => {
  try {
    mustEnv("POLAR_CLIENT_ID", CLIENT_ID);
    mustEnv("POLAR_CLIENT_SECRET", CLIENT_SECRET);
    mustEnv("POLAR_REDIRECT_URI", REDIRECT_URI);

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (!code || !state) {
      return res.status(400).send("Missing code/state");
    }

    const st = await db.query(
      `select user_id, expires_at from app.oauth_states where state = $1`,
      [state]
    );

    if (st.rowCount === 0) return res.status(400).send("Invalid state");

    const { user_id, expires_at } = st.rows[0] as {
      user_id: number;
      expires_at: string;
    };

    if (new Date(expires_at).getTime() < Date.now()) {
      await db.query(`delete from app.oauth_states where state = $1`, [state]);
      return res.status(400).send("Expired state");
    }

    await db.query(`delete from app.oauth_states where state = $1`, [state]);

    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch("https://polarremote.com/v2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenJson: any = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(400).send(`Token exchange failed: ${JSON.stringify(tokenJson)}`);
    }

    const accessToken = tokenJson.access_token as string;
    const refreshToken =
      typeof tokenJson.refresh_token === "string" ? tokenJson.refresh_token : null;
    const expiresIn =
      typeof tokenJson.expires_in === "number" ? tokenJson.expires_in : null;

    if (!accessToken) return res.status(400).send("No access_token returned");

    const tokenExpiresAt =
      expiresIn !== null ? new Date(Date.now() + expiresIn * 1000) : null;

    const regRes = await fetch("https://www.polaraccesslink.com/v3/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ "member-id": String(user_id) }),
    });

    const regJson: any = await regRes.json().catch(() => ({}));

    const polarUserId =
      regJson["polar-user-id"] ?? regJson["polar_user_id"] ?? regJson.user_id ?? null;

    if (!regRes.ok && !polarUserId) {
      return res.status(400).send(`User register failed: ${JSON.stringify(regJson)}`);
    }

    await db.query("begin");

    await db.query(
      `
      insert into app.user_integrations
        (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at)
      values
        ($1, 'polar', $2, $3, $4, $5)
      on conflict (user_id, provider)
      do update set
        provider_user_id = excluded.provider_user_id,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        updated_at = now()
      `,
      [
        user_id,
        polarUserId ? String(polarUserId) : null,
        accessToken,
        refreshToken,
        tokenExpiresAt,
      ]
    );

    await db.query(`update app.users set active_provider = 'polar' where id = $1`, [
      user_id,
    ]);

    await db.query("commit");

    res.redirect(`${APP_BASE_URL}/`);
  } catch (e) {
    await db.query("rollback").catch(() => {});
    next(e);
  }
});

// DELETE /api/v1/integrations/polar/unlink
polarRouter.delete("/unlink", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;

    const integ = await db.query(
      `
      select provider_user_id, access_token
      from app.user_integrations
      where user_id = $1 and provider = 'polar'
      `,
      [userId]
    );

    if (integ.rowCount === 0) {
      return res.json({ message: "Not linked" });
    }

    const { provider_user_id, access_token } = integ.rows[0] as {
      provider_user_id: string | null;
      access_token: string | null;
    };

    // Best-effort deregister from Polar; do not block unlink on expected statuses
    if (provider_user_id && access_token) {
      const r = await fetch(
        `https://www.polaraccesslink.com/v3/users/${encodeURIComponent(provider_user_id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (![204, 401, 403, 404].includes(r.status)) {
        const text = await r.text().catch(() => "");
        return res.status(400).json({ error: `Polar unlink failed: ${r.status} ${text}` });
      }
    }

    await db.query("begin");

    await db.query(
      `delete from app.user_integrations where user_id = $1 and provider = 'polar'`,
      [userId]
    );

    await db.query(
      `update app.users
       set active_provider = null
       where id = $1 and active_provider = 'polar'`,
      [userId]
    );

    await db.query("commit");

    res.json({ message: "Unlinked" });
  } catch (e) {
    await db.query("rollback").catch(() => {});
    next(e);
  }
});