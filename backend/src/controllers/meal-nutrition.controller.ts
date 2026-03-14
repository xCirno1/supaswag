import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_API_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a clinical hospital dietitian and nutritionist AI.
You provide accurate, evidence-based nutritional breakdowns for hospital meals.
Always output valid JSON only. No markdown, no explanation, just the JSON object.`;

// POST /analysis/meal-nutrition
export const getMealNutrition = async (req: Request, res: Response) => {
  const { mealName, mealType, patientConditions, patientAllergies, patientMedications, kcal } = req.body;

  if (!mealName) {
    return res.status(400).json({ error: 'mealName is required' });
  }

  const prompt = `Provide a detailed nutritional breakdown for this hospital meal:

Meal: "${mealName}"
Meal type: ${mealType || 'main course'}
Estimated calories: ${kcal || 'unknown'} kcal
Patient conditions: ${(patientConditions || []).join(', ') || 'none'}
Patient medications: ${(patientMedications || []).join(', ') || 'none'}
Patient allergies: ${(patientAllergies || []).join(', ') || 'none'}

Respond ONLY with valid JSON:
{
  "mealName": "string",
  "totalCalories": number,
  "servingSize": "string (e.g. 350g)",
  "macros": {
    "protein": { "grams": number, "pct": number },
    "carbs": { "grams": number, "pct": number },
    "fat": { "grams": number, "pct": number },
    "fiber": { "grams": number }
  },
  "micros": [
    { "name": "string", "amount": "string", "unit": "string", "rdaPct": number }
  ],
  "highlights": ["string"],
  "clinicalNotes": "string",
  "allergenWarnings": ["string"],
  "glycemicIndex": "Low|Medium|High",
  "suitableFor": ["string"],
  "keyIngredients": ["string"]
}

Include 6-8 micros (sodium, potassium, calcium, iron, vitamin C, vitamin D, magnesium, zinc).
highlights should be 2-3 positive nutritional points.
clinicalNotes should mention any relevant interactions with the patient's conditions/medications.
allergenWarnings should list any common allergens present.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return res.status(500).json({ error: 'Empty response from AI' });

    const parsed = JSON.parse(content);
    res.status(200).json(parsed);
  } catch (err) {
    console.error('[MealNutrition] Error:', err);
    res.status(500).json({ error: 'Nutrition analysis failed' });
  }
};