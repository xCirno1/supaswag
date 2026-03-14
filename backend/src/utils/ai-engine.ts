import dotenv from 'dotenv';
import Groq from "groq-sdk";
import { formatForAI } from './units';

dotenv.config();

interface FlaggedFoodId {
  id: string | number;
  reason: string;
}

interface AnalysisResult {
  patient: any;
  safeFoods: any[];
  flaggedFoods: { item: any; reason: string }[];
  summary: string;
}

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: apiKey });

const SYSTEM_PROMPT = `You are a clinical AI dietitian. 
You have comprehensive knowledge of:
- Drug-food interactions (e.g. Warfarin + Vitamin K, MAOIs + Tyramine, ACE inhibitors + Potassium)
- Common food allergies and cross-reactivity
- Disease-specific dietary restrictions (e.g. diabetes, renal disease, celiac)
All inventory quantities are stored in SI units: weight in grams (g), volume in millilitres (ml), count in pieces (pcs).
Always output valid JSON only.`;

function partitionInventory(
  inventory: any[],
  flaggedFoodIds: FlaggedFoodId[]
): Pick<AnalysisResult, 'safeFoods' | 'flaggedFoods'> {
  const flaggedMap = new Map(
    flaggedFoodIds.map(f => [String(f.id), f.reason])
  );

  return inventory.reduce<Pick<AnalysisResult, 'safeFoods' | 'flaggedFoods'>>(
    (acc, item) => {
      const reason = flaggedMap.get(String(item.id));
      reason
        ? acc.flaggedFoods.push({ item, reason })
        : acc.safeFoods.push(item);
      return acc;
    },
    { safeFoods: [], flaggedFoods: [] }
  );
}

export async function analyzeDietBatchWithGroq(
  patients: any[],
  inventory: any[]
): Promise<AnalysisResult[]> {
  // Build inventory list with human-readable quantities for the AI prompt
  const inventoryList = inventory.map(i => ({
    id: i.id,
    name: i.name,
    quantity: formatForAI(i.stock, i.unit),
    tags: i.tags,
  }));

  const prompt = `
    You are a clinical AI dietitian. Evaluate each patient's dietary restrictions against the inventory.
    DO NOT mention blocked foods if they do not present in the case.

    Patients:
    ${JSON.stringify(patients.map(p => ({
    id: p.id,
    name: p.name,
    conditions: p.conditions ?? [],
    medications: p.medications ?? [],
    allergies: p.allergies ?? [],
  })))}

    Inventory (quantities in SI units — g for weight, ml for volume, pcs for count):
    ${JSON.stringify(inventoryList)}

    Respond ONLY with a valid JSON object:
    {
      "results": [
        {
          "patientId": "patient_id",
          "flaggedFoodIds": [{ "id": "item_id", "reason": "Clinical reason" }],
          "summary": "Short clinical summary"
        }
      ]
    }
  `;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    model: process.env.GROQ_API_MODEL || "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq");

  const { results } = JSON.parse(content);

  const patientMap = new Map(patients.map(p => [String(p.id), p]));

  return results.map((r: any) => ({
    patient: patientMap.get(String(r.patientId)),
    ...partitionInventory(inventory, r.flaggedFoodIds ?? []),
    summary: r.summary ?? "AI Dietary Assessment complete.",
  }));
}

export async function analyzeDietBatch(patients: any[], inventory: any[]): Promise<AnalysisResult[]> {
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. dietary analysis requires an AI backend — " +
      "no safe static fallback exists for clinical drug-food interactions."
    );
  }

  try {
    return await analyzeDietBatchWithGroq(patients, inventory);
  } catch (err) {
    console.error("Groq SDK Error:", err);
    throw new Error(`Dietary analysis failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}