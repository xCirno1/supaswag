// TODO: Remove this later when database is implemented.

export type Medication = 'Warfarin' | 'Lisinopril' | 'Metformin' | 'MAOI' | 'None';
export type Allergy = 'Peanuts' | 'Shellfish' | 'Dairy' | 'Gluten' | 'None';
export type NutrientTag = 'High Vit K' | 'High Potassium' | 'High Sugar' | 'Tyramine' | 'Nut' | 'Dairy' | 'Safe';

export interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  conditions: string[];
  medications: Medication[];
  allergies: Allergy[];
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number; // in lbs/units
  unit: string;
  tags: NutrientTag[];
}

export const patients: Patient[] = [
  { id: 'P001', name: 'Eleanor Vance', age: 82, room: '101A', conditions: ['Atrial Fibrillation', 'Hypertension'], medications: ['Warfarin', 'Lisinopril'], allergies: ['None'] },
  { id: 'P002', name: 'Marcus Johnson', age: 74, room: '102B', conditions: ['Type 2 Diabetes'], medications: ['Metformin'], allergies: ['Peanuts', 'Dairy'] },
  { id: 'P003', name: 'Sylvia Plath', age: 88, room: '103A', conditions: ['Depression', 'Osteoporosis'], medications: ['MAOI'], allergies: ['Shellfish'] },
  { id: 'P004', name: 'Robert Ford', age: 79, room: '104C', conditions: ['Healthy Aging'], medications: ['None'], allergies: ['Gluten'] },
];

export const inventory: InventoryItem[] = [
  { id: 'I001', name: 'Fresh Spinach', stock: 50, unit: 'lbs', tags: ['High Vit K', 'Safe'] },
  { id: 'I002', name: 'Brown Rice', stock: 200, unit: 'lbs', tags: ['Safe'] },
  { id: 'I003', name: 'Aged Cheddar', stock: 30, unit: 'lbs', tags: ['Dairy', 'Tyramine'] },
  { id: 'I004', name: 'Salmon Fillets', stock: 80, unit: 'lbs', tags: ['Safe'] },
  { id: 'I005', name: 'Bananas', stock: 100, unit: 'lbs', tags: ['High Potassium', 'High Sugar'] },
  { id: 'I006', name: 'Peanut Butter', stock: 40, unit: 'jars', tags: ['Nut'] },
  { id: 'I007', name: 'Whole Wheat Bread', stock: 60, unit: 'loaves', tags: ['Safe'] },
];