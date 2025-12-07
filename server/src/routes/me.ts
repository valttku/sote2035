import { Router } from "express";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

export const meRouter = Router();

meRouter.get("/", authRequired, async (req, res) => {
  const userId = (req as any).userId;

  const result = await db.query(
    `select id, email, display_name
     from app.users
     where id = $1`,
    [userId]
  );

  res.json(result.rows[0]);
});
