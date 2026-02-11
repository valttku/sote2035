import { Router } from "express";
import { getHealthStatEntriesData } from "../db/healthStatEntriesDb.js";
import { authRequired } from "../middleware/authRequired.js";

export const homeRouter = Router();

// GET /api/v1/home?date=YYYY-MM-DD&part=heart|brain|legs|lungs
homeRouter.get("/", authRequired, async (req, res) => {
  const date = String(req.query.date ?? "");
  const part = String(req.query.part ?? "");

  if (!date || !part) {
    return res.status(400).json({ error: "date and part are required" });
  }

  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "not authenticated" });

  try {
    const metrics = await getHealthStatEntriesData(userId, date, part as any);
    res.json({ metrics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to load metrics" });
  }
});
