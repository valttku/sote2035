import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  createUser,
  findUserByEmail,
  updateLastLogin,
} from "../db/users/repo.js";
import { db } from "../db/db.js";

export const authRouter = Router();

// register
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await createUser(email, hash, displayName ?? null);

    res.status(201).json({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      created_at: user.created_at,
    });
  } catch (e) {
    next(e);
  }
});

// login
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await updateLastLogin(user.id);

    // create session valid for 7 days
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await db.query(
      `insert into app.sessions (user_id, expires_at)
       values ($1, $2)
       returning id`,
      [user.id, expires],
    );

    const sessionId = result.rows[0].id;

    // set HTTP-only cookie
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "lax",
      path: "/",
      domain: "localhost",
      expires,
    });

    res.json({
      message: "Login successful",
      email: user.email,
      display_name: user.display_name,
    });
  } catch (e) {
    next(e);
  }
});

// logout
authRouter.post("/logout", async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await db.query(
        `delete from app.sessions
         where id = $1`,
        [sessionId],
      );
    }

    // clearing cookie
    res.clearCookie("session", {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      sameSite: "lax",
      path: "/",
      domain: "localhost",
    });

    res.json({ message: "Logged out" });
  } catch (e) {
    next(e);
  }
});

// forgot password
authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.json({
        message: "If this email exists, a password reset email has been sent.",
      });
    }

    // removing possible old tokens
    await db.query(
      `delete from app.password_reset_tokens
       where user_id = $1`,
      [user.id],
    );

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // expires in 1 hour

    await db.query(
      `insert into app.password_reset_tokens (token, user_id, expires_at)
       values ($1, $2, $3)`,
      [token, user.id, expires],
    );

    // in production, send an email (not implemented yet)
    // during development, show the token in console:
    console.log("Password reset token for", email, "=>", token);

    return res.json({
      message: "If this email exists, a password reset email has been sent.",
    });
  } catch (e) {
    next(e);
  }
});

// reset password (after user clicks the link in email)
authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ error: "Missing fields" });

    const result = await db.query(
      `select user_id, expires_at
       from app.password_reset_tokens
       where token = $1`,
      [token],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const { user_id, expires_at } = result.rows[0];

    if (new Date(expires_at).getTime() < Date.now()) {
      await db.query(`delete from app.password_reset_tokens where token = $1`, [
        token,
      ]);
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `update app.users
       set password = $1
       where id = $2`,
      [hash, user_id],
    );

    // remove reset token
    await db.query(`delete from app.password_reset_tokens where token = $1`, [
      token,
    ]);

    // delete all sessions
    await db.query(
      `delete from app.sessions
       where user_id = $1`,
      [user_id],
    );

    return res.json({
      message: "Password has been reset. You can now log in.",
    });
  } catch (e) {
    next(e);
  }
});
