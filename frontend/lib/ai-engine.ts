import { Patient, InventoryItem, patients, inventory } from './mock-db';

// AI Knowledge Graph TODO: Add more
const CONTRAINDICATIONS: Record<string, string[]> = {
  'Warfarin': ['High Vit K'],
  'Lisinopril': ['High Potassium'],
  'MAOI': ['Tyramine'],
  'Metformin': ['High Sugar'],
};

const ALLERGY_MAP: Record<string, string[]> = {
  'Peanuts': ['Nut'],
  'Dairy': ['Dairy'],
};

export interface AIAnalysis {
  patient: Patient;
  safeFoods: InventoryItem[];
  flaggedFoods: { item: InventoryItem; reason: string }[];
  summary: string;
}

// Cross-reference EHR for a specific patient
export function analyzePatientDiet(patientId: string): AIAnalysis {
  const patient = patients.find(p => p.id === patientId)!;
  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found.`);
  }

  const safeFoods: InventoryItem[] = [];
  const flaggedFoods: { item: InventoryItem; reason: string }[] = [];

  let restrictions = new Set<string>();

  // Medication contraindications
  patient.medications.forEach(med => {
    if (CONTRAINDICATIONS[med]) {
      CONTRAINDICATIONS[med].forEach(tag => restrictions.add(tag));
    }
  });

  // Allergy restrictions
  patient.allergies.forEach(allergy => {
    if (ALLERGY_MAP[allergy]) {
      ALLERGY_MAP[allergy].forEach(tag => restrictions.add(tag));
    }
  });

  // Filter Inventory
  inventory.forEach(item => {
    let isSafe = true;
    for (const tag of item.tags) {
      if (restrictions.has(tag)) {
        isSafe = false;
        let reason = patient.medications.some(m => CONTRAINDICATIONS[m]?.includes(tag))
          ? `EHR Drug Interaction: Interferes with ${patient.medications.find(m => CONTRAINDICATIONS[m]?.includes(tag))}`
          : `Allergy Alert: Contains ${tag}`;
        flaggedFoods.push({ item, reason });
        break;
      }
    }
    if (isSafe) safeFoods.push(item);
  });

  // Generate AI Summary TODO: Implement AI
  const medText = patient.medications.includes('None') ? '' : `Patient is on ${patient.medications.join(', ')}. `;
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

// Bulk AI Food Orders based on aggregate patient needs
export function calculateBulkNeeds() {
  let needsAnalysis = inventory.map(item => ({ ...item, requested: 0, blockedCount: 0 }));

  patients.forEach(patient => {
    const analysis = analyzePatientDiet(patient.id);

    analysis.safeFoods.forEach(safeItem => {
      const idx = needsAnalysis.findIndex(n => n.id === safeItem.id);
      needsAnalysis[idx].requested += 1;
    });

    // Track how many patients are blocked from an item
    analysis.flaggedFoods.forEach(flagged => {
      const idx = needsAnalysis.findIndex(n => n.id === flagged.item.id);
      needsAnalysis[idx].blockedCount += 1;
    });
  });

  return needsAnalysis.map(item => ({
    ...item,
    status: item.stock < item.requested * 7 ? 'ORDER NOW' : 'SUFFICIENT', // 7 day supply check
    aiInsight: item.blockedCount > (patients.length / 2)
      ? `Warning: ${item.blockedCount} patients cannot eat this due to EHR conflicts. Reduce bulk order.`
      : 'Approved for general population.'
  }));
}