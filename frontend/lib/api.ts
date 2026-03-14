import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 0 = routine, 1 = low, 2 = high, 3 = critical
export type Priority = 0 | 1 | 2 | 3;

export const PRIORITY_CONFIG: Record<Priority, {
  label: string; shortLabel: string; color: string;
  bg: string; border: string; dotColor: string;
}> = {
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
  height_cm: number | null;
  weight_kg: number | null;
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
  bmiCategory: string;
  targetCalories: number;
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
  bmiCategory: string;
  targetCalories: number;
  mealPlanReason: string;
}

export interface AiLog {
  id: number;
  created_at: string;
  time?: string;
  severity: 'warn' | 'info' | 'ok';
  text: string;
}

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

// ── BMI helper (mirrors backend, keeps frontend self-contained) ──────────────

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

export function bmiColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Underweight': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
    case 'Normal weight': return { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' };
    case 'Overweight': return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
    case 'Obese': return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
    default: return { bg: '#F9F6F1', text: '#6B6860', border: '#E5E0D6' };
  }
}

export const getPatients = () =>
  apiClient.get<Patient[]>('/patients').then(r => r.data);

export const getPatientById = (id: string) =>
  apiClient.get<Patient>(`/patients/${id}`).then(r => r.data);

export const createPatient = (data: Partial<Patient>) =>
  apiClient.post<Patient>('/patients', data).then(r => r.data);

export const deletePatient = (id: string) =>
  apiClient.delete<{ message: string }>(`/patients/${id}`).then(r => r.data);

export const updatePatientPriority = (id: string, priority: Priority) =>
  apiClient.patch<Patient>(`/patients/${id}/priority`, { priority }).then(r => r.data);

export const updatePatientBMI = (
  id: string,
  data: { height_cm?: number | null; weight_kg?: number | null }
) => apiClient.patch<Patient>(`/patients/${id}/bmi`, data).then(r => r.data);

export const getInventory = () =>
  apiClient.get<InventoryItem[]>('/inventory').then(r => r.data);

export const updateInventoryStock = (id: string, stock: number) =>
  apiClient.patch<InventoryItem>(`/inventory/${id}`, { stock }).then(r => r.data);

export const createInventoryItem = (data: Partial<InventoryItem>) =>
  apiClient.post<InventoryItem>('/inventory', data).then(r => r.data);

export const createInventoryItemsBatch = async (items: Partial<InventoryItem>[]): Promise<InventoryItem[]> => {
  const results: InventoryItem[] = [];
  for (const item of items) results.push(await createInventoryItem(item));
  return results;
};

export const getPatientAnalysis = (id: string) =>
  apiClient.get<PatientAnalysis>(`/analysis/patient/${id}`).then(r => r.data);

export const getInventoryNeeds = () =>
  apiClient.get<InventoryNeed[]>('/analysis/inventory-needs').then(r => r.data);

export const getMealPlans = () =>
  apiClient.get<MealPlan[]>('/analysis/meal-plans').then(r => r.data);

export const getAiLogs = () =>
  apiClient.get<AiLog[]>('/analysis/logs').then(r => r.data);

export const getFoodPlanSuggestions = (payload: {
  rejectedNames: string[];
  approvedNames: string[];
  inventoryNames: string[];
  preference?: string;
}): Promise<{ items: Omit<SuggestedItem, 'id' | 'status'>[] }> =>
  apiClient.post('/food-plan/suggestions', payload).then(r => r.data);

export const getFoodPlanWeekPlan = (payload: {
  approvedItems: Pick<SuggestedItem, 'name' | 'weeklyQty'>[];
}): Promise<{ days: WeekPlanDay[] }> =>
  apiClient.post('/food-plan/week-plan', payload).then(r => r.data);

export const getMedications = () =>
  apiClient.get<string[]>('/medications').then(r => r.data);

export const addMedication = (name: string) =>
  apiClient.post<{ name: string }>('/medications', { name }).then(r => r.data);

export const getAllergies = () =>
  apiClient.get<string[]>('/allergies').then(r => r.data);

export const addAllergy = (name: string) =>
  apiClient.post<{ name: string }>('/allergies', { name }).then(r => r.data);