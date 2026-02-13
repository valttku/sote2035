import { Router } from "express";
import { getHealthStatEntriesData } from "../db/healthStats/healthStatsDb.js";
import { db } from "../db/db.js";
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
    // fetch gender of the user for avatar display
    const userRow = await db.query(
      `SELECT gender FROM app.users WHERE id = $1`,
      [userId],
    );
    const gender = userRow.rows?.[0]?.gender ?? null;

    // if part=summary, return alert status for each body part instead of detailed metrics
    if (part === "summary") {
      const parts: Array<"heart" | "brain" | "legs" | "lungs"> = [
        "brain",
        "heart",
        "lungs",
        "legs",
      ];

      const metricsByPart = await Promise.all(
        parts.map((p) => getHealthStatEntriesData(userId, date, p)),
      );

      const alerts: Record<string, boolean> = {};
      for (let i = 0; i < parts.length; i++) {
        const metrics = metricsByPart[i] ?? {};
        alerts[parts[i]] = Object.values(metrics).some((v: any) =>
          typeof v === "object" && v != null && "status" in v && v.status !== "good",
        );
      }

      return res.json({ alerts, user: { gender } });
    }

    const metrics = await getHealthStatEntriesData(userId, date, part as any);
    res.json({ metrics, user: { gender } });
    console.log("Fetched metrics for user", userId, "part", part, "date", date, ":", metrics);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to load metrics" });
  }
});
