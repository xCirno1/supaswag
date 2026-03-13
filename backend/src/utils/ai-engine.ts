import dotenv from 'dotenv';
import Groq from "groq-sdk";

dotenv.config();

interface FlaggedFoodId {
  id: string | number;
  reason: string;
}

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: apiKey });

export const CONTRAINDICATIONS: Record<string, string[]> = {
  'Warfarin': ['High Vit K'],
  'Lisinopril': ['High Potassium'],
  'MAOI': ['Tyramine'],
  'Metformin': ['High Sugar'],
};

export const ALLERGY_MAP: Record<string, string[]> = {
  'Peanuts': ['Nut'],
  'Dairy': ['Dairy'],
};

export async function analyzeDiet(patient: any, inventory: any[]) {
  if (apiKey) {
    try {
      const inventoryList = inventory.map(i => ({ id: i.id, name: i.name, tags: i.tags }));

      const prompt = `
        Evaluate this patient's dietary restrictions against the provided inventory.
        Patient:
        - Name: ${patient.name}
        - Conditions: ${patient.conditions?.join(', ')}
        - Medications: ${patient.medications?.join(', ')}
        - Allergies: ${patient.allergies?.join(', ')}

        Inventory:
        ${JSON.stringify(inventoryList)}

        Respond ONLY with a valid JSON object:
        {
          "flaggedFoodIds": [
            { "id": "item_id", "reason": "Clinical reason" }
          ],
          "summary": "Short clinical summary"
        }
      `;

      // Using the SDK instead of fetch
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a clinical AI dietitian. Always output valid JSON.' },
          { role: 'user', content: prompt }
        ],
        model: process.env.GROQ_API_MODEL || "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const content = chatCompletion.choices[0]?.message?.content;

      if (!content) throw new Error("Empty response from Groq");

      const parsed = JSON.parse(content);

      const safeFoods: any[] = [];
      const flaggedFoods: { item: any; reason: string }[] = [];
      const flaggedMap = new Map<string, string>();

      if (parsed.flaggedFoodIds && Array.isArray(parsed.flaggedFoodIds)) {
        parsed.flaggedFoodIds.forEach((f: FlaggedFoodId) => {
          flaggedMap.set(String(f.id), f.reason);
        });
      }

      inventory.forEach(item => {
        const reason = flaggedMap.get(String(item.id));
        if (reason) {
          flaggedFoods.push({ item, reason });
        } else {
          safeFoods.push(item);
        }
      });

      return {
        patient,
        safeFoods,
        flaggedFoods,
        summary: parsed.summary || "AI Dietary Assessment complete."
      };

    } catch (err) {
      console.error("Groq SDK Error:", err);
    }
  }

  const safeFoods: any[] = [];
  const flaggedFoods: { item: any; reason: string }[] = [];
  const restrictions = new Set<string>();

  patient.medications?.forEach((med: string) => {
    CONTRAINDICATIONS[med]?.forEach(tag => restrictions.add(tag));
  });

  patient.allergies?.forEach((allergy: string) => {
    ALLERGY_MAP[allergy]?.forEach(tag => restrictions.add(tag));
  });

  inventory.forEach(item => {
    const matchingTag = item.tags.find((tag: string) => restrictions.has(tag));
    if (matchingTag) {
      const isMed = patient.medications?.find((m: string) => CONTRAINDICATIONS[m]?.includes(matchingTag));
      const reason = isMed ? `EHR Drug Interaction: ${isMed}` : `Allergy Alert: ${matchingTag}`;
      flaggedFoods.push({ item, reason });
    } else {
      safeFoods.push(item);
    }
  });

  return {
    patient,
    safeFoods,
    flaggedFoods,
    summary: `Local Assessment: ${flaggedFoods.length > 0 ? 'Restrictions found.' : 'No major issues.'}`
  };
}