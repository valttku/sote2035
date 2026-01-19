import { Router } from "express";
import { getHealthData } from "../db/health.js";
import { authRequired } from "../middleware/authRequired.js";

// CURRENTLY AUTHENTICATION IS DISABLED, GETS HARD-CODED USER ID FOR TESTING PURPOSES

export const digitalTwinRouter = Router();

// GET /api/v1/digitalTwin?date=YYYY-MM-DD&part=heart|brain|legs|lungs
digitalTwinRouter.get("/", async (req, res) => {
  const date = String(req.query.date ?? "");
  const part = String(req.query.part ?? "");

  if (!date || !part) {
    return res.status(400).json({ error: "date and part are required" });
  }

  const userId = 4; // TEMPORARY: hardcoded for development
  //const userId = (req as any).user?.id;
  //if (!userId) return res.status(401).json({ error: "not authenticated" });

  try {
    const metrics = await getHealthData(userId, date, part as any);
    res.json({ metrics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to load metrics" });
  }
});
