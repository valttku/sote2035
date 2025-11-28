import { Router } from "express";
import { db } from "../db/db.js";
import bcrypt from "bcrypt";

export const settingsRouter = Router();

// helper: get user id based on session cookie
async function getUserIdFromSession(sessionId: string | undefined) {
  if (!sessionId) return null;

  const result = await db.query(
    `select user_id
     from app.sessions
     where id = $1
       and expires_at > now()`,
    [sessionId]
  );

  if (result.rowCount === 0) return null;

  return result.rows[0].user_id;
}


// GET /api/v1/settings
// returns user profile info
settingsRouter.get("/", async (req, res) => {
  const sessionId = req.cookies?.session;
  const userId = await getUserIdFromSession(sessionId);

  if (!userId) return res.status(401).json({ error: "Not logged in" });

  const result = await db.query(
    `select id, email, display_name, created_at, updated_at, last_login
     from app.users
     where id = $1`,
    [userId]
  );

  return res.json(result.rows[0]);
});

// PUT /api/v1/settings/display-name
// update display name
settingsRouter.put("/display-name", async (req, res) => {
  const sessionId = req.cookies?.session;
  const userId = await getUserIdFromSession(sessionId);

  if (!userId) return res.status(401).json({ error: "Not logged in" });

  const { displayName } = req.body;

  await db.query(
    `update app.users
     set display_name = $1
     where id = $2`,
    [displayName ?? null, userId]
  );

  res.json({ message: "Display name updated" });
});

// PUT /api/v1/settings/password
// change password (requires old password)
settingsRouter.put("/password", async (req, res) => {
  const sessionId = req.cookies?.session;
  const userId = await getUserIdFromSession(sessionId);

  if (!userId) return res.status(401).json({ error: "Not logged in" });

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return res.status(400).json({ error: "Missing password fields" });

  const result = await db.query(
    `select password
     from app.users
     where id = $1`,
    [userId]
  );

  const user = result.rows[0];

  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) return res.status(403).json({ error: "Old password incorrect" });

  const hashed = await bcrypt.hash(newPassword, 10);

  await db.query(
    `update app.users
     set password = $1
     where id = $2`,
    [hashed, userId]
  );

  res.json({ message: "Password changed" });
});

// DELETE /api/v1/settings/delete-account
// permanently delete user account + sessions
settingsRouter.delete("/delete-account", async (req, res) => {
  const sessionId = req.cookies?.session;
  const userId = await getUserIdFromSession(sessionId);

  if (!userId) return res.status(401).json({ error: "Not logged in" });

  // delete all sessions and user
  await db.query(`delete from app.sessions where user_id = $1`, [userId]);
  await db.query(`delete from app.users where id = $1`, [userId]);

  // clear cookie
  res.clearCookie("session", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  res.json({ message: "Account deleted permanently" });
});
