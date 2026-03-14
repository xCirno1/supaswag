import dotenv from 'dotenv';
import Groq from "groq-sdk";

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
Always output valid JSON only.`;

function buildPrompt(patient: any, inventory: any[]): string {
  return `
    Evaluate this patient's dietary restrictions against the provided inventory.
    
    Patient:
    - Name: ${patient.name}
    - Conditions: ${(patient.conditions ?? []).join(', ') || 'None'}
    - Medications: ${(patient.medications ?? []).join(', ') || 'None'}
    - Allergies: ${(patient.allergies ?? []).join(', ') || 'None'}

    Inventory:
    ${JSON.stringify(inventory.map(i => ({ id: i.id, name: i.name, tags: i.tags })))}

    Respond ONLY with a valid JSON object in this exact shape:
    {
      "flaggedFoodIds": [
        { "id": "item_id", "reason": "Clinical reason" }
      ],
      "summary": "Short clinical summary"
    }
  `;
}

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

async function analyzeWithGroq(patient: any, inventory: any[]): Promise<AnalysisResult> {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(patient, inventory) }
    ],
    model: process.env.GROQ_API_MODEL || "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq");

  const { flaggedFoodIds = [], summary = "AI Dietary Assessment complete." } = JSON.parse(content);

  return {
    patient,
    ...partitionInventory(inventory, flaggedFoodIds),
    summary,
  };
}

export async function analyzeDiet(patient: any, inventory: any[]): Promise<AnalysisResult> {
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. dietary analysis requires an AI backend — " +
      "no safe static fallback exists for clinical drug-food interactions."
    );
  }

  try {
    return await analyzeWithGroq(patient, inventory);
  } catch (err) {
    console.error("Groq SDK Error:", err);
    throw new Error(`Dietary analysis failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}