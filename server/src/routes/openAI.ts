import express, { Request, Response } from "express";
import { OpenAI } from "openai";

const openAIRouter = express.Router();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

openAIRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    res.json({ result: response.choices[0].message?.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export { openAIRouter };
