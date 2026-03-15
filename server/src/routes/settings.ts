import { Router } from "express";
import { db } from "../db/db.js";
import bcrypt from "bcrypt";
import { authRequired } from "../middleware/authRequired.js";

export const settingsRouter = Router();

//Deregister from polar
async function deregisterFromPolar(userId: number) {
  const integ = await db.query(
    `
    select provider_user_id, access_token
    from app.user_integrations
    where user_id = $1 and provider = 'polar'
    `,
    [userId],
  );

  if (integ.rowCount === 0) return;

  const { provider_user_id, access_token } = integ.rows[0] as {
    provider_user_id: string | null;
    access_token: string | null;
  };

  if (!provider_user_id || !access_token) return;

  const res = await fetch(
    `https://www.polaraccesslink.com/v3/users/${encodeURIComponent(provider_user_id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  if (![204, 401, 403, 404].includes(res.status)) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polar deregistration failed: ${res.status} ${text}`);
  }
}

// Deregister from garmin


//GET /api/v1/settings
settingsRouter.get("/", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    //add here parameters

    const result = await db.query(
      `select id, email, display_name, gender, height, weight, birthday, created_at, updated_at, last_login, active_provider
       from app.users
       where id = $1`,
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }


    // Add booleans for frontend convenience
    const user = result.rows[0];
    res.json({
      ...user,
      polarLinked: user.active_provider === "polar",
      garminLinked: user.active_provider === "garmin",
    });
  } catch (e) {
    next(e);
  }
});

// PUT /api/v1/settings/profile
settingsRouter.patch("/profile", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    let { displayName, gender, height, weight, birthday } = req.body;

    // Convert numbers
    if (height !== undefined) height = Number(height);
    if (weight !== undefined) weight = Number(weight);

    // Convert birthday
    if (birthday !== undefined && typeof birthday === "string") {
      birthday = birthday ? new Date(birthday) : null;
      if (birthday && isNaN(birthday.getTime())) {
        return res.status(400).json({ error: "Invalid birthday" });
      }
    }

    // Validation
    if (displayName !== undefined && displayName.length > 100) {
      return res.status(400).json({ error: "Display name too long" });
    }
    if (height !== undefined && (isNaN(height) || height < 0)) {
      return res.status(400).json({ error: "Invalid height" });
    }
    if (weight !== undefined && (isNaN(weight) || weight < 0)) {
      return res.status(400).json({ error: "Invalid weight" });
    }
    if (gender !== undefined && !["male", "female"].includes(gender)) {
      return res.status(400).json({ error: "Invalid gender" });
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (displayName !== undefined) {
      fields.push(`display_name = $${index++}`);
      values.push(displayName);
    }

    if (gender !== undefined) {
      fields.push(`gender = $${index++}`);
      values.push(gender);
    }

    if (height !== undefined) {
      fields.push(`height = $${index++}`);
      values.push(height);
    }

    if (weight !== undefined) {
      fields.push(`weight = $${index++}`);
      values.push(weight);
    }

    if (birthday !== undefined) {
      fields.push(`birthday = $${index++}`);
      values.push(birthday);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE app.users
       SET ${fields.join(", ")}, updated_at = now()
       WHERE id = $${index}
       RETURNING id, email, display_name, gender, height, weight, birthday, created_at, updated_at, last_login`,
      values,
    );

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

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
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(oldPassword, result.rows[0].password);
    if (!ok) {
      return res.status(403).json({ error: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      `update app.users
       set password = $1
       where id = $2`,
      [hashed, userId],
    );

    res.json({ message: "Password changed" });
  } catch (e) {
    next(e);
  }
});

settingsRouter.put("/email", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { newEmail } = req.body;

    // Basic validation
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    // Check if email is taken
    const emailCheck = await db.query(
      `select id from app.users where email = $1 and id != $2`,
      [newEmail, userId],
    );

    if ((emailCheck.rowCount ?? 0) > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Update email and return updated user
    const result = await db.query(
      `update app.users
        set email = $1
        where id = $2
        returning id, email, display_name, gender, height, weight, birthday, created_at, updated_at, last_login
      `,
      [newEmail, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

settingsRouter.delete(
  "/delete-account",
  authRequired,
  async (req, res, next) => {
    try {
      const userId = (req as any).userId as number;

      await deregisterFromPolar(userId);

      await db.query("begin");

      const result = await db.query(`delete from app.users where id = $1`, [
        userId,
      ]);

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
      await db.query("rollback").catch(() => {});
      next(e);
    }
  },
);