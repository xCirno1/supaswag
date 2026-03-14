import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_API_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a hospital food procurement and dietitian AI. 
You have comprehensive knowledge of:
- Bulk food procurement for hospital cafeterias
- Nutritional value of foods for patient populations
- Cost-effective food sourcing
- Hospital dietary requirements and portion planning
Always output valid JSON only. No markdown, no explanation, just the JSON object.`;

// POST /food-plan/suggestions
export const getSuggestions = async (req: Request, res: Response) => {
  const { rejectedNames = [], approvedNames = [], inventoryNames = [] } = req.body;

  const { preference = '' } = req.body;

  const prefLine = preference.trim()
    ? `User preference / special request: "${preference.trim()}" — prioritise items that satisfy this.`
    : '';

  const prompt = `You are a hospital food procurement AI. Suggest 5 bulk food items to purchase for a hospital cafeteria.

${prefLine}
Current inventory (do NOT suggest these — we want NEW items to expand the menu): ${inventoryNames.join(', ') || 'none'}
Already approved this session: ${approvedNames.join(', ') || 'none'}
Rejected (do NOT suggest these): ${rejectedNames.join(', ') || 'none'}

Suggestions can be items not already in the current inventory list above or in the inventory.
For each item, suggest a real food distributor with a plausible URL.
Focus on cost-effective bulk staples suitable for a hospital: proteins, grains, vegetables, dairy.

Respond ONLY with valid JSON:
{
  "items": [
    {
      "name": "string",
      "category": "Protein|Grain|Vegetable|Dairy|Fruit|Other",
      "reason": "one sentence why this is good value for a hospital",
      "estimatedPrice": "$X.XX / kg",
      "distributorName": "string",
      "distributorUrl": "https://...",
      "weeklyQty": "X kg",
      "tags": ["bulk", "high-protein"]
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return res.status(500).json({ error: 'Empty response from AI' });

    const parsed = JSON.parse(content);
    res.status(200).json(parsed);
  } catch (err) {
    console.error('[FoodPlan] Suggestions error:', err);
    res.status(500).json({ error: 'AI suggestion failed' });
  }
};

// POST /food-plan/week-plan
export const getWeekPlan = async (req: Request, res: Response) => {
  const { approvedItems = [] } = req.body;

  if (!approvedItems.length) {
    return res.status(400).json({ error: 'No approved items provided' });
  }

  const prompt = `You are a hospital dietitian. Create a 7-day bulk food plan using ONLY these approved ingredients:
${approvedItems.map((i: any) => `- ${i.name} (${i.weeklyQty}/week)`).join('\n')}

Each day should have breakfast, lunch, and dinner suitable for a hospital.
Keep meals simple, nutritious, and cost-effective.

Respond ONLY with valid JSON:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        { "time": "Breakfast", "description": "string" },
        { "time": "Lunch", "description": "string" },
        { "time": "Dinner", "description": "string" }
      ]
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return res.status(500).json({ error: 'Empty response from AI' });

    const parsed = JSON.parse(content);
    res.status(200).json(parsed);
  } catch (err) {
    console.error('[FoodPlan] Week plan error:', err);
    res.status(500).json({ error: 'AI week plan generation failed' });
  }
};