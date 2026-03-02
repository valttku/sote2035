import { getAICompletion } from "../services/openAIService.js";

/**
 * Health AI response generator
 */
export async function generateHealthAIResponse(message: string) {

  // System instruction prompt
  const prompt = `
You are a health assistant AI.

Rules:
- Provide general health information only.
- Do not diagnose disease.
- Encourage doctor consultation if symptoms are serious.
- Be friendly and simple.

User Question:
${message}
`;

  // Call OpenAI service
  return await getAICompletion(prompt);
}