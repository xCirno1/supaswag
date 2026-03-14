import { createPatient, deletePatient, updateInventoryStock, createInventoryItem, addAllergy, addMedication } from '@/lib/api';
import type { Priority } from '@/lib/api';

export async function addPatientAction(data: {
  name: string;
  age: number;
  room: string;
  medications?: string[];
  allergies?: string[];
  priority?: Priority;
  height_cm?: number | null;
  weight_kg?: number | null;
}) {
  await createPatient({
    name: data.name,
    age: data.age,
    room: data.room,
    conditions: ['New Patient Admission'],
    medications: data.medications?.length ? data.medications : ['None'],
    allergies: data.allergies?.length ? data.allergies : ['None'],
    priority: data.priority ?? 0,
    height_cm: data.height_cm ?? null,
    weight_kg: data.weight_kg ?? null,
  });
}

export async function removePatientAction(id: string) {
  await deletePatient(id);
}

export async function updateStockAction(id: string, newStock: number) {
  if (!isNaN(newStock)) {
    await updateInventoryStock(id, newStock);
  }
}

export async function addInventoryAction(data: {
  name: string;
  unit: string;
  stock: number;
}) {
  if (!data.name || !data.unit || isNaN(data.stock)) return;
  try {
    await createInventoryItem({ name: data.name, unit: data.unit, stock: data.stock, tags: [] });
  } catch (err) {
    console.warn('Backend missing POST /inventory endpoint. Ignoring creation locally.');
  }
}

export async function addMedicationAction(name: string) {
  if (name.trim()) await addMedication(name.trim());
}

export async function addAllergyAction(name: string) {
  if (name.trim()) await addAllergy(name.trim());
}