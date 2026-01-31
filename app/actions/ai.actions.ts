"use server";

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "@/lib/firebase";
import { AIAnalysisResponse } from "@/lib/types";

const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-3-flash-preview" });

export async function processJournalEntry(text: string): Promise<AIAnalysisResponse> {
  const prompt = `
    You are ELIA (Environmental Lifecycle Intelligence Assistant). 
    Analyze the user's daily sustainability journal and provide a precise environmental impact report.

    Rules for Analysis:
    1. EXTRACT DATA: Estimate CO2 (kg), Water (L), Energy (kWh), Waste (kg), and Food Impact (1-10 scale).
    2. POINTS: Award 1-50 points based on intentionality and scale of positive impact.
    3. COMMENTARY: Be professional, encouraging, and brief (max 15 words). Focus on the "Win of the Day".
    4. CLARIFICATION: If the entry is vague (e.g., "did some good stuff" or entry is 1 sentence), provide exactly 1-2 tactical follow-up questions in "followUpQuestions".
    5. STRICT OUTPUT: Return valid JSON only.

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
    throw new Error("ELIA systems encounterd an error while parsing your entry.");
  }
}
