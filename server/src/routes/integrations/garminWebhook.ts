import { Router } from "express";

export const garminWebhookRouter = Router();

garminWebhookRouter.post("/", async (req, res) => {
  console.log("Garmin webhook payload:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});
