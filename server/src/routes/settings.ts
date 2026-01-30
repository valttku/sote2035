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
    [userId]
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
    }
  );

  if (![204, 401, 403, 404].includes(res.status)) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polar deregistration failed: ${res.status} ${text}`);
  }
}

//GET /api/v1/settings
settingsRouter.get("/", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
//add here parameters

    const result = await db.query(
      `select id, email, display_name,gender, height, weight, created_at, updated_at, last_login
       from app.users
       where id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    //add console for checking
    console.log("SETTINGS USER FROM DB:", result.rows[0]);

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

// PUT /api/v1/settings/profile
settingsRouter.put("/profile", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    let { displayName, gender, height, weight } = req.body;

    // Convert height/weight to numbers if they come as strings
    if (height !== undefined) height = Number(height);
    if (weight !== undefined) weight = Number(weight);

    // Validation
    if (displayName && displayName.length > 100) {
      return res.status(400).json({ error: "Display name too long" });
    }
    if (height !== undefined && (isNaN(height) || height < 0)) {
      return res.status(400).json({ error: "Invalid height" });
    }
    if (weight !== undefined && (isNaN(weight) || weight < 0)) {
      return res.status(400).json({ error: "Invalid weight" });
    }
    if (gender && !["male", "female", "other", "unknown"].includes(gender)) {
      return res.status(400).json({ error: "Invalid gender" });
    }

    const result = await db.query(
      `UPDATE app.users
       SET display_name = $1,
           gender = $2,
           height = $3,
           weight = $4,
           updated_at = now()
       WHERE id = $5
       RETURNING id, email, display_name, gender, height, weight, created_at, updated_at, last_login`,
      [displayName ?? null, gender ?? null, height ?? null, weight ?? null, userId]
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
      return res.status(400).json({ error: "Password must be at least 8 characters" });
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

    const ok = await bcrypt.compare(oldPassword, result.rows[0].password);
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

//Add here new endpoint for height,weight, gender
settingsRouter.put("/profile", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { gender, height, weight } = req.body;

    if (
      gender !== null &&
      gender !== undefined &&
      !["male", "female", "other", "unknown"].includes(gender)
    ) {
      return res.status(400).json({ error: "Invalid gender" });
    }

    if (height !== null && height !== undefined && typeof height !== "number") {
      return res.status(400).json({ error: "Invalid height" });
    }

    if (weight !== null && weight !== undefined && typeof weight !== "number") {
      return res.status(400).json({ error: "Invalid weight" });
    }

    await db.query(
      `
      update app.users
      set
        gender = $1,
        height = $2,
        weight = $3,
        updated_at = now()
      where id = $4
      `,
      [gender ?? null, height ?? null, weight ?? null, userId]
    );

    res.json({ message: "Profile updated" });
  } catch (e) {
    next(e);
  }
});


settingsRouter.delete("/delete-account", authRequired, async (req, res, next) => {
  try {
    const userId = (req as any).userId as number;

    await deregisterFromPolar(userId);

    await db.query("begin");

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
    await db.query("rollback").catch(() => {});
    next(e);
  }
});
