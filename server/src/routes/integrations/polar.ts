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

// GET /api/v1/integrations/polar/connect
polarRouter.get("/connect", authRequired, async (req, res, next) => {
  try {
    mustEnv("POLAR_CLIENT_ID", CLIENT_ID);
    mustEnv("POLAR_REDIRECT_URI", REDIRECT_URI);

    const userId = (req as any).userId as number;

    // CSRF protection: create a random state and store it in DB (short-lived)
    const state = crypto.randomUUID();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      `
      create table if not exists app.oauth_states (
        state uuid primary key,
        user_id integer not null references app.users(id) on delete cascade,
        expires_at timestamptz not null
      );
      `
    );

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

    // scopes are controlled in Polar admin by selected data types; Polar docs show scope usage
    // Some clients still require a scope param; if Polar rejects without it, add scope here.

    res.redirect(url.toString());
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/integrations/polar/callback?code=...&state=...
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

    // verify state -> get userId
    const st = await db.query(
      `select user_id, expires_at from app.oauth_states where state = $1`,
      [state]
    );

    if (st.rowCount === 0) return res.status(400).send("Invalid state");

    const { user_id, expires_at } = st.rows[0];

    if (new Date(expires_at).getTime() < Date.now()) {
      await db.query(`delete from app.oauth_states where state = $1`, [state]);
      return res.status(400).send("Expired state");
    }

    // one-time use state
    await db.query(`delete from app.oauth_states where state = $1`, [state]);

    // exchange code -> access token
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
      return res
        .status(400)
        .send(`Token exchange failed: ${JSON.stringify(tokenJson)}`);
    }

    const accessToken = tokenJson.access_token as string;
    if (!accessToken) return res.status(400).send("No access_token returned");

    // register user in AccessLink (required)
    const regRes = await fetch("https://www.polaraccesslink.com/v3/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        "member-id": String(user_id), // use your user id as stable member-id
      }),
    });

    const regJson: any = await regRes.json().catch(() => ({}));

    if (!regRes.ok) {
      return res
        .status(400)
        .send(`User register failed: ${JSON.stringify(regJson)}`);
    }

    // Polar returns a polar-user-id field (string/number depending on API)
    const polarUserId =
      regJson["polar-user-id"] ?? regJson["polar_user_id"] ?? regJson.user_id;

    if (!polarUserId) {
      return res.status(400).send(`Missing polar user id: ${JSON.stringify(regJson)}`);
    }

    // store in app.polar_accounts (your table)
    await db.query(
      `
      insert into app.polar_accounts (user_id, polar_user_id, access_token)
      values ($1, $2, $3)
      on conflict (user_id)
      do update set polar_user_id = excluded.polar_user_id,
                    access_token = excluded.access_token
      `,
      [user_id, String(polarUserId), accessToken]
    );

    // redirect back to frontend
    res.redirect(`${APP_BASE_URL}`);
  } catch (e) {
    next(e);
  }
});
