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

export function analyzeDiet(patient: any, inventory: any[]) {
  const safeFoods: any[] = [];
  const flaggedFoods: { item: any; reason: string }[] = [];
  let restrictions = new Set<string>();

  // Map Medications to Restrictions
  if (patient.medications) {
    patient.medications.forEach((med: string) => {
      if (CONTRAINDICATIONS[med]) {
        CONTRAINDICATIONS[med].forEach(tag => restrictions.add(tag));
      }
    });
  }

  // Map Allergies to Restrictions
  if (patient.allergies) {
    patient.allergies.forEach((allergy: string) => {
      if (ALLERGY_MAP[allergy]) {
        ALLERGY_MAP[allergy].forEach(tag => restrictions.add(tag));
      }
    });
  }

  // Filter Inventory
  inventory.forEach(item => {
    let isSafe = true;
    for (const tag of item.tags) {
      if (restrictions.has(tag)) {
        isSafe = false;
        let reason = patient.medications?.some((m: string) => CONTRAINDICATIONS[m]?.includes(tag))
          ? `EHR Drug Interaction: Interferes with ${patient.medications.find((m: string) => CONTRAINDICATIONS[m]?.includes(tag))}`
          : `Allergy Alert: Contains ${tag}`;
        flaggedFoods.push({ item, reason });
        break;
      }
    }
    if (isSafe) safeFoods.push(item);
  });

  const meds = patient.medications || [];
  const medText = meds.includes('None') || meds.length === 0 ? '' : `Patient is on ${meds.join(', ')}. `;
  const flagText = flaggedFoods.length > 0
    ? `CRITICAL: Must avoid ${flaggedFoods.map(f => f.item.name).join(', ')} due to interactions.`
    : `No major dietary contraindications detected.`;

  return {
    patient,
    safeFoods,
    flaggedFoods,
    summary: `AI Dietary Assessment: ${medText}${flagText}`
  };
}