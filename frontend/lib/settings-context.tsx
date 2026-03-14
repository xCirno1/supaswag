"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export type WeightUnit = 'g' | 'kg' | 'oz' | 'lb';
export type EnergyUnit = 'kcal' | 'kJ';

interface Settings {
  weightUnit: WeightUnit;
  energyUnit: EnergyUnit;
  loading: boolean;
  setWeightUnit: (u: WeightUnit) => void;
  setEnergyUnit: (u: EnergyUnit) => void;
}

const SettingsContext = createContext<Settings>({
  weightUnit: 'g',
  energyUnit: 'kcal',
  loading: true,
  setWeightUnit: () => { },
  setEnergyUnit: () => { },
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>('g');
  const [energyUnit, setEnergyUnitState] = useState<EnergyUnit>('kcal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/settings`)
      .then(res => {
        const { weight_unit, energy_unit } = res.data;
        if (weight_unit) setWeightUnitState(weight_unit as WeightUnit);
        if (energy_unit) setEnergyUnitState(energy_unit as EnergyUnit);
      })
      .catch(() => {
        // Fall back to localStorage if the backend is unreachable
        const w = localStorage.getItem('weightUnit') as WeightUnit;
        const e = localStorage.getItem('energyUnit') as EnergyUnit;
        if (w) setWeightUnitState(w);
        if (e) setEnergyUnitState(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (weight_unit: WeightUnit, energy_unit: EnergyUnit) => {
    localStorage.setItem('weightUnit', weight_unit);
    localStorage.setItem('energyUnit', energy_unit);
    axios.patch(`${API_BASE}/settings`, { weight_unit, energy_unit }).catch(() => {
    });
  };

  const setWeightUnit = (u: WeightUnit) => {
    setWeightUnitState(u);
    persist(u, energyUnit);
  };

  const setEnergyUnit = (u: EnergyUnit) => {
    setEnergyUnitState(u);
    persist(weightUnit, u);
  };

  return (
    <SettingsContext.Provider value={{ weightUnit, energyUnit, loading, setWeightUnit, setEnergyUnit }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);