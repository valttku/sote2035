import { Router } from "express";
import { db } from "../../db/db.js";

export const garminWebhookRouter = Router();

// POST /api/v1/integrations/garmin/webhook
garminWebhookRouter.post("/", async (req, res) => {
  const payload = req.body;
  if (payload.userMetrics && Array.isArray(payload.userMetrics)) {
    for (const metric of payload.userMetrics) {
      // Map Garmin user ID to your app's user ID
      const garminUserId = metric.userId;
      const result = await db.query(
        "SELECT user_id FROM app.user_integrations WHERE provider_user_id = $1",
        [garminUserId],
      );

      if (!result.rows.length) {
        console.warn("No app user found for Garmin ID:", garminUserId);
        continue; // skip this metric if we can't find the user
      }

      const appUserId = result.rows[0].user_id;

      console.log(`App User ID: ${appUserId}`);
      console.log(`Garmin User ID: ${garminUserId}`);
      console.log(`VO2 Max: ${metric.vo2Max}`);
      console.log(`Fitness Age: ${metric.fitnessAge}`);
      console.log(`Summary ID: ${metric.summaryId}`);

      // Here you can save metric to your user_metrics table
      //await upsertUserActivities(appUserId, metric);
    }
  }
});
