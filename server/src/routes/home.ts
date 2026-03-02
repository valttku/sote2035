import { Router } from "express";
import { getHealthStatEntriesData } from "../db/healthStatEntries/healthStatEntriesDb.js";
import { getAICompletion } from "../services/openAIService.js";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

// Home route provides health summary and detailed metrics for the homepage.
const homeRouter = Router();

// Simple in-memory AI cache
type CachedAI = {
  message: string;
  createdAt: number;
};

const aiCache = new Map<string, CachedAI>();

// Optional: cache expiration (e.g. 6 hours)
const AI_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

// GET /api/v1/home?date=YYYY-MM-DD&part=heart|brain|legs|lungs|summary
homeRouter.get("/", authRequired, async (req, res) => {
  // Extract date and part from query parameters
  const date = String(req.query.date ?? "");
  const part = String(req.query.part ?? "");
  const ai = String(req.query.ai ?? "0");

  // Validate required parameters
  if (!date || !part) {
    return res.status(400).json({ error: "date and part are required" });
  }

  // Get authenticated user ID
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "not authenticated" });

  try {
    // Fetch gender for avatar display
    const userRow = await db.query(
      `SELECT gender FROM app.users WHERE id = $1`,
      [userId],
    );
    const gender = userRow.rows?.[0]?.gender ?? null;

    // If requesting summary, return alert status for each body part
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
      const outOfRangeDetails: Array<{
        part: string;
        metric: string;
        status: string;
        value: any;
      }> = [];

      for (let i = 0; i < parts.length; i++) {
        const metrics = metricsByPart[i] ?? {};
        alerts[parts[i]] = false;

        for (const [metric, value] of Object.entries(metrics)) {
          if (
            typeof value === "object" &&
            value != null &&
            "status" in value &&
            (value.status === "low" || value.status === "high")
          ) {
            alerts[parts[i]] = true;
            outOfRangeDetails.push({
              part: parts[i],
              metric,
              status: value.status,
              value: (value as any).value,
            });
          }
        }
      }

      // Determine if we should generate an AI message
      const hasDefinedStatus = outOfRangeDetails.length > 0;
      const hasAlerts = Object.values(alerts).some(Boolean);

      let aiMessage: string | null = null;
      let aiStatus: "none" | "generated" | "quota_exceeded" | "error" = "none";

      const cacheKey = `${userId}-${date}`;
      const cached = aiCache.get(cacheKey);

      // Remove expired cache
      if (cached && Date.now() - cached.createdAt > AI_CACHE_TTL) {
        aiCache.delete(cacheKey);
      }

      // Re-check after possible delete
      const validCache = aiCache.get(cacheKey);

      // Determine if we can use cached AI message
      if (validCache) {
        aiMessage = validCache.message;
        aiStatus = "generated";
      } else if (hasDefinedStatus) {
        if (ai !== "1") {
          // There are alerts but frontend didn't request AI generation
          aiStatus = "none";
        } else {
          try {
            const prompt = `
            You are a health assistant. Here are the user's health alerts for ${date}:

            ${outOfRangeDetails
              .map(
                (d) => `- ${d.part}: ${d.metric} is ${d.status} (${d.value})`,
              )
              .join("\n")}

            Give concise, specific, actionable advice.
            `;

            aiMessage = await getAICompletion(prompt);

            aiCache.set(cacheKey, {
              message: aiMessage,
              createdAt: Date.now(),
            });

            aiStatus = "generated";
          } catch (err: any) {
            console.error("[home route] AI failed:", err);

            if (err?.message?.includes("quota")) {
              aiStatus = "quota_exceeded";
            } else {
              aiStatus = "error";
            }
          }
        }
      }

      return res.json({
        alerts,
        hasAlerts,
        user: { gender },
        aiMessage,
        aiStatus,
      });
    }

    // Otherwise, fetch detailed metrics for the selected body part
    const metrics = await getHealthStatEntriesData(userId, date, part as any);
    res.json({ metrics, user: { gender } });
    console.log(
      "Fetched metrics for user",
      userId,
      "part",
      part,
      "date",
      date,
      ":",
      metrics,
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to load metrics" });
  }
});

export { homeRouter };
