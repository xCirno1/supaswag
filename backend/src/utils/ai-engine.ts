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
  bmiCategory: string;
  targetCalories: number;
  mealPlanReason: string;
  suggestedBreakfast: string;
  suggestedBreakfastKcal: number;
  suggestedLunch: string;
  suggestedLunchKcal: number;
  suggestedDinner: string;
  suggestedDinnerKcal: number;
  suggestedSide: string;
}

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey });

const SYSTEM_PROMPT = `You are a clinical AI dietitian.
You have comprehensive knowledge of:
- Drug-food interactions (e.g. Warfarin + Vitamin K, MAOIs + Tyramine, ACE inhibitors + Potassium)
- Common food allergies and cross-reactivity
- Disease-specific dietary restrictions (e.g. diabetes, renal disease, celiac)
- BMI-based nutritional planning (underweight, normal, overweight, obese categories)
- Age-adjusted caloric requirements (elderly, adult, paediatric)
- Mifflin-St Jeor estimated daily caloric needs
All inventory quantities are stored in SI units: weight in grams (g), volume in millilitres (ml), count in pieces (pcs).
Always output valid JSON only.

Instructions per patient:
1. Flag dangerous foods based on conditions, medications, and allergies → flaggedFoodIds.
2. Calibrate meals to BMI category and targetCaloriesPerDay:
   - Underweight  → calorie-dense, generous portions
   - Normal weight → balanced standard hospital portions
   - Overweight   → moderate portions, lean proteins, high-fibre
   - Obese        → reduced-calorie, low-GI, high-protein, high-fibre
   - Age ≥ 65     → soft textures, higher protein, calcium-rich sides
   - Age < 18     → age-appropriate portions, nutrient-dense
3. Suggest three meals from ONLY safe inventory items. Each meal must be a real named dish.
   Calorie split: breakfast ≈ 25%, lunch ≈ 35%, dinner ≈ 40% of targetCaloriesPerDay.
   kcal values must be plain integers. Never suggest a flagged food.
4. Write ONE mealPlanReason: a single 2-3 sentence plain-English explanation of why today's
   entire meal plan was designed this way for this specific patient. Reference their BMI
   category, age, calorie target, and any key clinical constraints (conditions, medications,
   allergies) that shaped the choices. Name the dietary strategy used (e.g. "low-GI",
   "high-protein", "calorie-dense"). Write it as if explaining to a nurse reading the chart.

Respond ONLY with valid JSON:
{
  "results": [
    {
      "patientId": "patient_id",
      "flaggedFoodIds": [{ "id": "item_id", "reason": "Clinical reason" }],
      "summary": "Short clinical summary, include bmi summary too",
      "bmiCategory": "Normal weight",
      "targetCalories": 1800,
      "mealPlanReason": "Today's meal plan was designed as a ... (also mention BMI if required)",
      "suggestedBreakfast": "...",
      "suggestedBreakfastKcal": 450,
      "suggestedLunch": "...",
      "suggestedLunchKcal": 630,
      "suggestedDinner": "...",
      "suggestedDinnerKcal": 720,
      "suggestedSide": "..."
    }
  ]
}
`;

export function calcBMI(weight_kg: number, height_cm: number): number {
  const h = height_cm / 100;
  return parseFloat((weight_kg / (h * h)).toFixed(1));
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function estimateDailyCalories(
  weight_kg: number | null,
  height_cm: number | null,
  age: number | null,
): number {
  if (!weight_kg || !height_cm || !age) return 1800;
  const bmrMale = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  const bmrFemale = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  return Math.round(((bmrMale + bmrFemale) / 2) * 1.2);
}

function partitionInventory(
  inventory: any[],
  flaggedFoodIds: FlaggedFoodId[]
): Pick<AnalysisResult, 'safeFoods' | 'flaggedFoods'> {
  const flaggedMap = new Map(flaggedFoodIds.map(f => [String(f.id), f.reason]));
  return inventory.reduce<Pick<AnalysisResult, 'safeFoods' | 'flaggedFoods'>>(
    (acc, item) => {
      const reason = flaggedMap.get(String(item.id));
      reason ? acc.flaggedFoods.push({ item, reason }) : acc.safeFoods.push(item);
      return acc;
    },
    { safeFoods: [], flaggedFoods: [] }
  );
}

export async function analyzeDietBatchWithGroq(
  patients: any[],
  inventory: any[]
): Promise<AnalysisResult[]> {

  const inventoryList = inventory.map(i => ({
    id: i.id, name: i.name,
    quantity: formatForAI(i.stock, i.unit),
    tags: i.tags,
  }));

  const patientContext = patients.map(p => {
    const bmi = (p.weight_kg && p.height_cm)
      ? calcBMI(parseFloat(p.weight_kg), parseFloat(p.height_cm))
      : null;
    const category = bmi ? bmiCategory(bmi) : 'Unknown';
    const targetKcal = estimateDailyCalories(
      p.weight_kg ? parseFloat(p.weight_kg) : null,
      p.height_cm ? parseFloat(p.height_cm) : null,
      p.age ? parseInt(p.age) : null,
    );
    return {
      id: p.id, name: p.name, age: p.age ?? null,
      height_cm: p.height_cm ? parseFloat(p.height_cm) : null,
      weight_kg: p.weight_kg ? parseFloat(p.weight_kg) : null,
      bmi, bmiCategory: category, targetCaloriesPerDay: targetKcal,
      conditions: p.conditions ?? [],
      medications: p.medications ?? [],
      allergies: p.allergies ?? [],
    };
  });

  const prompt = `
You are a clinical AI dietitian. Analyse each patient's dietary restrictions AND biometric profile against the inventory.

Patients (with biometric data):
${JSON.stringify(patientContext, null, 2)}

Inventory (SI units — g for weight, ml for volume, pcs for count):
${JSON.stringify(inventoryList)}
`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    model: process.env.GROQ_API_MODEL || 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  const { results } = JSON.parse(content);
  const patientMap = new Map(patients.map(p => [String(p.id), p]));
  console.log('[AI] Batch analysis results:', results);

  return results.map((r: any) => {
    const patient = patientMap.get(String(r.patientId));
    const bmi = (patient?.weight_kg && patient?.height_cm)
      ? calcBMI(parseFloat(patient.weight_kg), parseFloat(patient.height_cm))
      : null;
    return {
      patient,
      ...partitionInventory(inventory, r.flaggedFoodIds ?? []),
      summary: r.summary ?? 'AI Dietary Assessment complete.',
      bmiCategory: r.bmiCategory ?? (bmi ? bmiCategory(bmi) : 'Unknown'),
      targetCalories: r.targetCalories ?? estimateDailyCalories(
        patient?.weight_kg ? parseFloat(patient.weight_kg) : null,
        patient?.height_cm ? parseFloat(patient.height_cm) : null,
        patient?.age ? parseInt(patient.age) : null,
      ),
      mealPlanReason: r.mealPlanReason ?? '',
      suggestedBreakfast: r.suggestedBreakfast,
      suggestedBreakfastKcal: r.suggestedBreakfastKcal,
      suggestedLunch: r.suggestedLunch,
      suggestedLunchKcal: r.suggestedLunchKcal,
      suggestedDinner: r.suggestedDinner,
      suggestedDinnerKcal: r.suggestedDinnerKcal,
      suggestedSide: r.suggestedSide,
    };
  });
}

export async function analyzeDietBatch(patients: any[], inventory: any[]): Promise<AnalysisResult[]> {
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Dietary analysis requires an AI backend — ' +
      'no safe static fallback exists for clinical drug-food interactions.'
    );
  }
  try {
    return await analyzeDietBatchWithGroq(patients, inventory);
  } catch (err) {
    console.error('Groq SDK Error:', err);
    throw new Error(`Dietary analysis failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}