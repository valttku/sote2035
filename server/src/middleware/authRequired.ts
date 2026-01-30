import { Request, Response, NextFunction } from "express";
import { db } from "../db/db.js";

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // validate session
    const result = await db.query(
      `select user_id
       from app.sessions
       where id = $1
         and expires_at > now()`,
      [sessionId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    // attach user id to the request object
    (req as any).userId = result.rows[0].user_id;

    next();
  } catch (e) {
    console.error("authRequired error:", e);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
