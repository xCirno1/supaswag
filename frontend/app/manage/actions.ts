import { createPatient, deletePatient, updateInventoryStock, createInventoryItem } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function addPatientAction(formData: FormData) {
  const name = formData.get('name') as string;
  const age = parseInt(formData.get('age') as string, 10);
  const room = formData.get('room') as string;

  const medications = formData.getAll('medications') as string[];
  const allergies = formData.getAll('allergies') as string[];

  await createPatient({
    name,
    age,
    room,
    conditions: ['New Patient Admission'],
    medications: medications.length ? medications : ['None'],
    allergies: allergies.length ? allergies : ['None']
  });

  revalidatePath('/');
  revalidatePath('/patients');
  revalidatePath('/manage');
  revalidatePath('/meal-plans');
  revalidatePath('/inventory');
}

export async function removePatientAction(id: string) {
  await deletePatient(id);

  revalidatePath('/');
  revalidatePath('/patients');
  revalidatePath('/manage');
  revalidatePath('/meal-plans');
  revalidatePath('/inventory');
}

export async function updateStockAction(id: string, formData: FormData) {
  const newStock = parseInt(formData.get('stock') as string, 10);

  if (!isNaN(newStock)) {
    await updateInventoryStock(id, newStock);
  }

  revalidatePath('/');
  revalidatePath('/inventory');
  revalidatePath('/manage');
}

export async function addInventoryAction(formData: FormData) {
  const name = formData.get('name') as string;
  const unit = formData.get('unit') as string;
  const stock = parseInt(formData.get('stock') as string, 10);

  if (!name || !unit || isNaN(stock)) return;

  try {
    await createInventoryItem({ name, unit, stock, tags: [] });
  } catch (err) {
    console.warn("Backend missing POST /inventory endpoint. Ignoring creation locally.");
  }

  revalidatePath('/');
  revalidatePath('/inventory');
  revalidatePath('/manage');
}