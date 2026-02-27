import express from "express";
import { generateHealthAIResponse } from "../ai/chatAIService";
import { checkEmergencyRisk } from "../ai/safetyGuard";

const router = express.Router();

/**
 * Health Chat API Endpoint
 */
router.post("/", async (req, res) => {

  try {

    // Get message from frontend
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "Message is required"
      });
    }

    // Safety Guard Check
    if (checkEmergencyRisk(message)) {
      return res.json({
        reply:
          "This may be an emergency. Please seek medical help immediately."
      });
    }

    // Generate AI response
    const reply = await generateHealthAIResponse(message);

    res.json({ reply });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      reply: "AI service error"
    });
  }
});

export default router;