import { Router } from "express";
import { db } from "../db/db.js";
import bcrypt from "bcrypt";
import { authRequired } from "../middleware/authRequired.js";

export const settingsRouter = Router();

// GET /api/v1/settings
settingsRouter.get("/", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;

    const result = await db.query(
      `select id, email, display_name, created_at, updated_at, last_login
       from app.users
       where id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

// PUT /api/v1/settings/display-name
settingsRouter.put("/display-name", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { displayName } = req.body;

    if (
      displayName !== null &&
      displayName !== undefined &&
      typeof displayName !== "string"
    ) {
      return res.status(400).json({ error: "Invalid display name" });
    }

    if (typeof displayName === "string" && displayName.length > 100) {
      return res.status(400).json({ error: "Display name too long" });
    }

    await db.query(
      `update app.users
       set display_name = $1
       where id = $2`,
      [displayName ?? null, userId]
    );

    res.json({ message: "Display name updated" });
  } catch (e) {
    next(e);
  }
});

// PUT /api/v1/settings/password
settingsRouter.put("/password", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Missing password fields" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const result = await db.query(
      `select password
       from app.users
       where id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(403).json({ error: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      `update app.users
       set password = $1
       where id = $2`,
      [hashed, userId]
    );

    res.json({ message: "Password changed" });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/v1/settings/delete-account
settingsRouter.delete("/delete-account", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;

    await db.query("begin");

    // One delete; DB cascades remove sessions, reset tokens, health data, integrations, etc.
    const result = await db.query(`delete from app.users where id = $1`, [userId]);

    if (result.rowCount === 0) {
      await db.query("rollback");
      return res.status(404).json({ error: "User not found" });
    }

    await db.query("commit");

    res.clearCookie("session", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });

    res.json({ message: "Account deleted permanently" });
  } catch (e) {
    await db.query("rollback");
    next(e);
  }
});
