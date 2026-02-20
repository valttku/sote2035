import { Router } from "express";
import { getHealthStatEntriesData } from "../db/healthStatEntries/healthStatEntriesDb.js";
import { getAICompletion } from "../services/openAIService.js";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/authRequired.js";

// Home route provides health summary and detailed metrics for the homepage.
const homeRouter = Router();

// GET /api/v1/home?date=YYYY-MM-DD&part=heart|brain|legs|lungs|summary
// - If part=summary: returns alert status for each body part (true if any metric is out of range)
// - If part=heart|brain|legs|lungs: returns detailed metrics for the selected body part
// Requires authentication.

homeRouter.get("/", authRequired, async (req, res) => {
  // Extract date and part from query parameters
  const date = String(req.query.date ?? "");
  const part = String(req.query.part ?? "");

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
      // Define body parts to check
      const parts: Array<"heart" | "brain" | "legs" | "lungs"> = [
        "brain",
        "heart",
        "lungs",
        "legs",
      ];

      // Fetch metrics for each part
      const metricsByPart = await Promise.all(
        parts.map((p) => getHealthStatEntriesData(userId, date, p)),
      );

      // Build alerts object: true if any metric for the part is 'low' or 'high'
      const alerts: Record<string, boolean> = {};
      const outOfRangeDetails: Array<{ part: string; metric: string; status: string; value: any }> = [];
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
              value: value.value,
            });
          }
        }
      }

      // Log alerts for debugging
      console.log("[home route] alerts:", alerts);
      console.log("[home route] outOfRangeDetails:", outOfRangeDetails);

      // Build prompt for OpenAI
      let prompt = `You are a health assistant. Here are the user's health alerts for ${date}:\n`;
      if (outOfRangeDetails.length > 0) {
        prompt += `The following metrics are out of range:\n`;
        for (const detail of outOfRangeDetails) {
          prompt += `- ${detail.part}: ${detail.metric} is ${detail.status} (${detail.value})\n`;
        }
        prompt += `\nGive specific advice for each out-of-range metric, and explain why it matters. Keep your advice concise and actionable.\n`;
      } else {
        prompt += `All metrics are within healthy ranges. Congratulate the user and encourage them to keep up the good work!`;
      }
      const aiMessage = await getAICompletion(prompt);

      // Respond with alerts, user gender, and AI message
      return res.json({ alerts, user: { gender }, aiMessage });
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
