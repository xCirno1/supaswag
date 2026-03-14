import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// PATIENTS
export const getPatients = () =>
  apiClient.get<Patient[]>('/patients').then((res) => res.data);

export const getPatientById = (id: string) =>
  apiClient.get<Patient>(`/patients/${id}`).then((res) => res.data);

export const createPatient = (data: Partial<Patient>) =>
  apiClient.post<Patient>('/patients', data).then((res) => res.data);

export const deletePatient = (id: string) =>
  apiClient.delete<{ message: string }>(`/patients/${id}`).then((res) => res.data);

// INVENTORY
export const getInventory = () =>
  apiClient.get<InventoryItem[]>('/inventory').then((res) => res.data);

export const updateInventoryStock = (id: string, stock: number) =>
  apiClient.patch<InventoryItem>(`/inventory/${id}`, { stock }).then((res) => res.data);

export const createInventoryItem = (data: Partial<InventoryItem>) =>
  apiClient.post<InventoryItem>('/inventory', data).then((res) => res.data); // TODO: Waiting for backend

// AI ENGINE
export const getPatientAnalysis = (id: string) =>
  apiClient.get<PatientAnalysis>(`/analysis/patient/${id}`).then((res) => res.data);

export const getInventoryNeeds = () =>
  apiClient.get<InventoryNeed[]>('/analysis/inventory-needs').then((res) => res.data);

export const getMealPlans = () =>
  apiClient.get<MealPlan[]>('/analysis/meal-plans').then((res) => res.data);

export const getAiLogs = () =>
  apiClient.get<AiLog[]>('/analysis/logs').then((res) => res.data);

// CLINICAL OPTIONS
export const getMedications = () =>
  apiClient.get<string[]>('/medications').then((res) => res.data);

export const addMedication = (name: string) =>
  apiClient.post<{ name: string }>('/medications', { name }).then((res) => res.data);

export const getAllergies = () =>
  apiClient.get<string[]>('/allergies').then((res) => res.data);

export const addAllergy = (name: string) =>
  apiClient.post<{ name: string }>('/allergies', { name }).then((res) => res.data);
