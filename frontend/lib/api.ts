import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 0 = routine, 1 = low, 2 = high, 3 = critical
export type Priority = 0 | 1 | 2 | 3;

export const PRIORITY_CONFIG: Record<Priority, { label: string; shortLabel: string; color: string; bg: string; border: string; dotColor: string }> = {
  0: { label: 'Routine', shortLabel: 'Routine', color: '#a8a29e', bg: 'rgba(168,162,158,0.08)', border: 'rgba(168,162,158,0.25)', dotColor: '#c4bfba' },
  1: { label: 'Low', shortLabel: 'Low', color: '#16a34a', bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.25)', dotColor: '#4ade80' },
  2: { label: 'High', shortLabel: 'High', color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.28)', dotColor: '#fbbf24' },
  3: { label: 'Critical', shortLabel: 'CRIT', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.3)', dotColor: '#f87171' },
};

export interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  priority: Priority;
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
  breakfast: string;
  breakfastKcal: number;
  lunch: string;
  lunchKcal: number;
  dinner: string;
  dinnerKcal: number;
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

// ── Food Plan types ──────────────────────────────────────────────────────────
export interface SuggestedItem {
  id: string;
  name: string;
  category: string;
  reason: string;
  estimatedPrice: string;
  distributorName: string;
  distributorUrl: string;
  weeklyQty: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface WeekPlanDay {
  day: string;
  meals: { time: string; description: string }[];
}

// PATIENTS
export const getPatients = () =>
  apiClient.get<Patient[]>('/patients').then((res) => res.data);

export const getPatientById = (id: string) =>
  apiClient.get<Patient>(`/patients/${id}`).then((res) => res.data);

export const createPatient = (data: Partial<Patient>) =>
  apiClient.post<Patient>('/patients', data).then((res) => res.data);

export const deletePatient = (id: string) =>
  apiClient.delete<{ message: string }>(`/patients/${id}`).then((res) => res.data);

export const updatePatientPriority = (id: string, priority: Priority) =>
  apiClient.patch<Patient>(`/patients/${id}/priority`, { priority }).then((res) => res.data);

// INVENTORY
export const getInventory = () =>
  apiClient.get<InventoryItem[]>('/inventory').then((res) => res.data);

export const updateInventoryStock = (id: string, stock: number) =>
  apiClient.patch<InventoryItem>(`/inventory/${id}`, { stock }).then((res) => res.data);

export const createInventoryItem = (data: Partial<InventoryItem>) =>
  apiClient.post<InventoryItem>('/inventory', data).then((res) => res.data);

export const createInventoryItemsBatch = async (items: Partial<InventoryItem>[]): Promise<InventoryItem[]> => {
  const results: InventoryItem[] = [];
  for (const item of items) {
    results.push(await createInventoryItem(item));
  }
  return results;
};

// AI ENGINE
export const getPatientAnalysis = (id: string) =>
  apiClient.get<PatientAnalysis>(`/analysis/patient/${id}`).then((res) => res.data);

export const getInventoryNeeds = () =>
  apiClient.get<InventoryNeed[]>('/analysis/inventory-needs').then((res) => res.data);

export const getMealPlans = () =>
  apiClient.get<MealPlan[]>('/analysis/meal-plans').then((res) => res.data);

export const getAiLogs = () =>
  apiClient.get<AiLog[]>('/analysis/logs').then((res) => res.data);

// AI FOOD PLAN
export const getFoodPlanSuggestions = (payload: {
  rejectedNames: string[];
  approvedNames: string[];
  inventoryNames: string[];
  preference?: string;
}): Promise<{ items: Omit<SuggestedItem, 'id' | 'status'>[] }> =>
  apiClient.post('/food-plan/suggestions', payload).then((res) => res.data);

export const getFoodPlanWeekPlan = (payload: {
  approvedItems: Pick<SuggestedItem, 'name' | 'weeklyQty'>[];
}): Promise<{ days: WeekPlanDay[] }> =>
  apiClient.post('/food-plan/week-plan', payload).then((res) => res.data);

// CLINICAL OPTIONS
export const getMedications = () =>
  apiClient.get<string[]>('/medications').then((res) => res.data);

export const addMedication = (name: string) =>
  apiClient.post<{ name: string }>('/medications', { name }).then((res) => res.data);

export const getAllergies = () =>
  apiClient.get<string[]>('/allergies').then((res) => res.data);

export const addAllergy = (name: string) =>
  apiClient.post<{ name: string }>('/allergies', { name }).then((res) => res.data);