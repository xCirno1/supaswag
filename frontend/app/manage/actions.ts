'use server'

import { patients, inventory, Medication, Allergy } from '@/lib/mock-db';
import { revalidatePath } from 'next/cache';

export async function addPatientAction(formData: FormData) {
  const name = formData.get('name') as string;
  const age = parseInt(formData.get('age') as string, 10);
  const room = formData.get('room') as string;

  // Safely generate the next ID
  const maxIdNum = patients.reduce((max, p) => {
    const num = parseInt(p.id.replace('P', ''), 10);
    return isNaN(num) ? max : (num > max ? num : max);
  }, 0);
  const id = `P${String(maxIdNum + 1).padStart(3, '0')}`;

  const medications = formData.getAll('medications') as Medication[];
  const allergies = formData.getAll('allergies') as Allergy[];

  patients.push({
    id,
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
  const idx = patients.findIndex(p => p.id === id);
  if (idx > -1) {
    patients.splice(idx, 1);
  }
  revalidatePath('/');
  revalidatePath('/patients');
  revalidatePath('/manage');
  revalidatePath('/meal-plans');
  revalidatePath('/inventory');
}

export async function updateStockAction(id: string, formData: FormData) {
  const newStock = parseInt(formData.get('stock') as string, 10);
  const item = inventory.find(i => i.id === id);
  if (item && !isNaN(newStock)) {
    item.stock = newStock;
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

  const maxIdNum = inventory.reduce((max, item) => {
    const num = parseInt(item.id.replace(/\D/g, ''), 10);
    return isNaN(num) ? max : (num > max ? num : max);
  }, 0);
  const id = `INV${String(maxIdNum + 1).padStart(3, '0')}`;

  inventory.push({
    id,
    name,
    unit,
    stock,
    tags: [],
  } as any);

  revalidatePath('/');
  revalidatePath('/inventory');
  revalidatePath('/manage');
}