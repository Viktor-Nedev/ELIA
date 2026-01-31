"use server";

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "@/lib/firebase";
import { AIAnalysisResponse } from "@/lib/types";

const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-3-flash-preview" });

export async function processJournalEntry(text: string, previousContext?: { question: string, answer: string }[]): Promise<AIAnalysisResponse> {
  const contextString = previousContext 
    ? `\nAdditional Context (Follow-up answers):\n${previousContext.map(c => `Q: ${c.question}\nA: ${c.answer}`).join("\n")}`
    : "";

  const prompt = `
    You are ELIA (Environmental Lifecycle Intelligence Assistant). 
    Analyze the user's daily sustainability journal and provide a precise environmental impact report.
    ${contextString}

    Rules for Analysis:
    1. EXTRACT DATA: Estimate CO2 (kg), Water (L), Energy (kWh), Waste (kg), and Food Impact (1-10 scale).
    2. POINTS: Award 1-50 points based on intentionality and scale of positive impact.
    3. COMMENTARY: Be professional, encouraging, and brief (max 15 words). Focus on the "Win of the Day".
    4. CLARIFICATION: If the entry is vague or missing key details for calculation, provide exactly 1 tactical follow-up question in "followUpQuestions".
    5. REFINEMENT: If follow-up answers are provided in the context, use them to significantly improve the accuracy of the "emissions" and "points".
    6. STRICT OUTPUT: Return valid JSON only.

    Journal Entry: "${text}"

    JSON Schema:
    {
      "emissions": {
        "co2": number,
        "water": number,
        "energy": number,
        "waste": number,
        "food": number
      },
      "points": number,
      "comment": "string",
      "followUpQuestions": ["string"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(jsonText) as AIAnalysisResponse;
  } catch (error) {
    console.error("ELIA Analysis Error:", error);
    throw new Error("ELIA systems encountered an error while parsing your entry.");
  }
}
