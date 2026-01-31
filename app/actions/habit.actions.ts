"use server";

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "@/lib/firebase";
import { Habit } from "@/lib/types";
import { sustainabilityService } from "@/lib/sustainability.service";

const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-3-flash-preview" });

export async function generatePersonalizedHabits(): Promise<Habit[]> {
  const prompt = `
    You are ELIA, a personal sustainability coach. 
    Analyze the user's focus on environmental preservation and suggest 3 high-impact, achievable habits.

    Guidelines:
    1. CATEGORIES: Each habit must focus on one: co2, water, energy, waste, or food.
    2. DIFFICULTY: Assign "easy", "medium", or "hard".
    3. DESCRIPTION: Max 15 words. Describe exactly WHAT to do.
    4. VARIETY: Ensure the 3 habits belong to different impact categories.
    5. STRICT OUTPUT: Valid JSON only.

    JSON Format:
    {
      "habits": [
        {
          "title": "string",
          "description": "string",
          "impactType": "co2 | water | energy | waste | food",
          "difficulty": "easy | medium | hard"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonText);
    return data.habits as Habit[];
  } catch (error) {
    console.error("Habit Generation Error:", error);
    return [];
  }
}

