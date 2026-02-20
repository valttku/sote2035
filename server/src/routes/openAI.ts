import express, { Request, Response } from "express";
import { getAICompletion } from "../services/openAIService.js";

const openAIRouter = express.Router();

openAIRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const result = await getAICompletion(prompt);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export { openAIRouter };
