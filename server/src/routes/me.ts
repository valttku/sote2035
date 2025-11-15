import { Router } from "express";
import { db } from "../db/db.js";

export const meRouter = Router();

meRouter.get("/", async (req, res) => {
  const sessionId = req.cookies?.session;
  if (!sessionId)
    return res.status(401).json({ error: "Not logged in" });

  const result = await db.query(
    `select u.id, u.email, u.display_name
     from app.sessions s
     join app.users u on u.id = s.user_id
     where s.id = $1
       and s.expires_at > now()`,
    [sessionId]
  );

  if (result.rowCount === 0)
    return res.status(401).json({ error: "Session expired or invalid" });

  return res.json(result.rows[0]);
});
