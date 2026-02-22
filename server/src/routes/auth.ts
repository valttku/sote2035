import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { transporter } from "../services/emailService.js";
import {
  createUser,
  findUserByEmail,
  updateLastLogin,
} from "../db/users/usersDb.js";
import { db } from "../db/db.js";

export const authRouter = Router();

// --- REGISTER ---
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName, gender, height, weight } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "User already exists" });

    // optional: validate new fields
    if (gender && !["male", "female", "other", "unknown"].includes(gender)) {
      return res.status(400).json({ error: "Invalid gender" });
    }
    if (height !== undefined && (isNaN(height) || height < 0)) {
      return res.status(400).json({ error: "Invalid height" });
    }
    if (weight !== undefined && (isNaN(weight) || weight < 0)) {
      return res.status(400).json({ error: "Invalid weight" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser(
      email,
      hash,
      displayName ?? null,
      gender ?? null,
      height ?? null,
      weight ?? null,
    );

    // Create session valid for 7 days (one session per user)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newSessionId = crypto.randomUUID();
    const result = await db.query(
      `INSERT INTO app.sessions (id, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET id = EXCLUDED.id,
                     expires_at = EXCLUDED.expires_at,
                     created_at = now()
       RETURNING id`,
      [newSessionId, user.id, expires],
    );

    const sessionId = result.rows[0].id;

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires,
    });
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

// --- LOGIN ---
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await updateLastLogin(user.id);

    // Create session valid for 7 days (one session per user)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newSessionId = crypto.randomUUID();
    const result = await db.query(
      `INSERT INTO app.sessions (id, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET id = EXCLUDED.id,
                     expires_at = EXCLUDED.expires_at,
                     created_at = now()
       RETURNING id`,
      [newSessionId, user.id, expires],
    );

    const sessionId = result.rows[0].id;

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
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

// --- LOGOUT ---
authRouter.post("/logout", async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await db.query(`DELETE FROM app.sessions WHERE id = $1`, [sessionId]);
    }

    res.clearCookie("session", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
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
    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await findUserByEmail(email);

    if (!user) {
      // Always respond the same way for security
      return res.json({
        message: "If this email exists, a password reset email has been sent.",
      });
    }

    // Remove old tokens
    await db.query(`DELETE FROM app.password_reset_tokens WHERE user_id = $1`, [
      user.id,
    ]);

    // Create new token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.query(
      `INSERT INTO app.password_reset_tokens (token, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [token, user.id, expires],
    );

    // Create reset URL
    const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;

    // Send the actual email
    await transporter.sendMail({
      from: `"Digital Twin" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    console.log("Password reset email sent to", email);

    return res.json({
      message: "If this email exists, a password reset email has been sent.",
    });
  } catch (err) {
    next(err);
  }
});

// reset password
authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password required" });
    }

    // Find token in DB
    const result = await db.query(
      `SELECT user_id, expires_at FROM app.password_reset_tokens WHERE token = $1`,
      [token],
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const { user_id, expires_at } = result.rows[0];
    if (new Date() > expires_at) {
      return res.status(400).json({ error: "Token expired" });
    }

    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.query(`UPDATE app.users SET password = $1 WHERE id = $2`, [
      hash,
      user_id,
    ]);

    // Delete the token after use
    await db.query(`DELETE FROM app.password_reset_tokens WHERE token = $1`, [
      token,
    ]);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
});
