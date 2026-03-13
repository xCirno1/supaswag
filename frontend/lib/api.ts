const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  tags: string[];
}

export interface InventoryNeed extends InventoryItem {
  requested: number;
  blockedCount: number;
  status: 'ORDER NOW' | 'SUFFICIENT';
  aiInsight: string;
}

export interface FlaggedFood {
  item: InventoryItem;
  reason: string;
}

export interface PatientAnalysis {
  patient: Patient;
  safeFoods: InventoryItem[];
  flaggedFoods: FlaggedFood[];
  summary: string;
}

export interface MealPlan {
  patient: { id: string; name: string; room: string };
  protein: string;
  side: string;
  flags: FlaggedFood[];
}

export interface AiLog {
  id: number;
  created_at: string;
  time?: string;
  severity: 'warn' | 'info' | 'ok';
  text: string;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}

// PATIENTS
export const getPatients = () => fetchAPI<Patient[]>('/patients');
export const getPatientById = (id: string) => fetchAPI<Patient>(`/patients/${id}`);
export const createPatient = (data: Partial<Patient>) => fetchAPI<Patient>('/patients', { method: 'POST', body: JSON.stringify(data) });
export const deletePatient = (id: string) => fetchAPI<{ message: string }>(`/patients/${id}`, { method: 'DELETE' });

// INVENTORY
export const getInventory = () => fetchAPI<InventoryItem[]>('/inventory');
export const updateInventoryStock = (id: string, stock: number) => fetchAPI<InventoryItem>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify({ stock }) });
export const createInventoryItem = (data: Partial<InventoryItem>) => fetchAPI<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(data) }); // Note: Backend may not have this route yet.

// AI ENGINE
export const getPatientAnalysis = (id: string) => fetchAPI<PatientAnalysis>(`/analysis/patient/${id}`);
export const getInventoryNeeds = () => fetchAPI<InventoryNeed[]>('/analysis/inventory-needs');
export const getMealPlans = () => fetchAPI<MealPlan[]>('/analysis/meal-plans');
export const getAiLogs = () => fetchAPI<AiLog[]>('/analysis/logs');