import { Router } from "express";

export const garminWebhookRouter = Router();

// POST /api/v1/integrations/garmin/webhook
garminWebhookRouter.post("/", async (req, res) => {
  try {
    const payload = req.body;

    // Print the full payload for inspection
    console.log("Garmin webhook payload received:");
    console.dir(payload, { depth: null, colors: true });

    // If there are userMetrics, log each individually
    if (payload.userMetrics && Array.isArray(payload.userMetrics)) {
      payload.userMetrics.forEach((metric: any, index: number) => {
        console.log(`\nUser Metric #${index + 1}`);
        console.log(`User ID: ${metric.userId}`);
        console.log(`Date: ${metric.calendarDate}`);
        console.log(`VO2 Max: ${metric.vo2Max}`);
        console.log(`Fitness Age: ${metric.fitnessAge}`);
        console.log(`Enhanced: ${metric.enhanced}`);
        console.log(`Summary ID: ${metric.summaryId}`);
      });
    }

    // Always respond 200 to Garmin so it doesn't retry
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.sendStatus(500);
  }
});
