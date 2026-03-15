import { Router } from "express";
import { getHealthStatEntriesData } from "../db/digitalTwin/healthMetricsDb.js";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";
import { detectAlerts, getCachedAIAdvice } from "../services/homeService.js";

const homeRouter = Router();

// GET /api/v1/home?date=YYYY-MM-DD&part=heart|brain|legs|lungs|summary
homeRouter.get("/", authRequired, async (req, res, next) => {
  const date = String(req.query.date ?? "");
  const part = String(req.query.part ?? "");
  const aiRequested = req.query.ai === "1";

  if (!date || !part) {
    return res.status(400).json({ error: "date and part are required" });
  }

  const userId = (req as any).userId;

  try {
    // Fetch user gender for avatar
    const userRow = await db.query(
      `SELECT gender FROM app.users WHERE id = $1`,
      [userId]
    );

    const gender = userRow.rows?.[0]?.gender ?? null;

    // SUMMARY REQUEST
    if (part === "summary") {
      const parts: Array<"heart" | "brain" | "legs" | "lungs"> = [
        "brain",
        "heart",
        "lungs",
        "legs",
      ];

      const metricsByPart = await Promise.all(
        parts.map((p) => getHealthStatEntriesData(userId, date, p))
      );

      // Detect alerts using service
      const { alerts, outOfRangeDetails } = detectAlerts(metricsByPart, parts);

      // Get cached AI advice
      const aiResult = await getCachedAIAdvice(
        userId,
        date,
        outOfRangeDetails,
        aiRequested
      );

      return res.json({
        alerts,
        hasAlerts: Object.values(alerts).some(Boolean),
        user: { gender },
        aiMessage: aiResult.message,
        aiStatus: aiResult.status,
      });
    }

    // BODY PART METRICS REQUEST
    const metrics = await getHealthStatEntriesData(userId, date, part as any);

    res.json({
      metrics,
      user: { gender },
    });

  } catch (e) {
    next(e);
  }
});

export { homeRouter };