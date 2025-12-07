import { Router } from "express";
import { db } from "../db/db.js";
import bcrypt from "bcrypt";
import { authRequired } from "../middleware/authRequired.js";

export const settingsRouter = Router();

// GET /api/v1/settings
settingsRouter.get("/", authRequired, async (req, res) => {
  const userId = (req as any).userId;

  const result = await db.query(
    `select id, email, display_name, created_at, updated_at, last_login
     from app.users
     where id = $1`,
    [userId]
  );

  res.json(result.rows[0]);
});

// PUT /api/v1/settings/display-name
settingsRouter.put("/display-name", authRequired, async (req, res) => {
  const userId = (req as any).userId;
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
settingsRouter.put("/password", authRequired, async (req, res) => {
  const userId = (req as any).userId;

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
settingsRouter.delete("/delete-account", authRequired, async (req, res) => {
  const userId = (req as any).userId;

  // remove user & sessions
  await db.query(`delete from app.sessions where user_id = $1`, [userId]);
  await db.query(`delete from app.users where id = $1`, [userId]);

  res.clearCookie("session", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  res.json({ message: "Account deleted permanently" });
});
