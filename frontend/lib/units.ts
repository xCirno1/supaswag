import type { WeightUnit, EnergyUnit } from './settingsContext';

export type SIUnit = 'g' | 'ml' | 'pcs';

const WEIGHT_FACTORS: Record<WeightUnit, number> = {
  g: 1,
  kg: 0.001,
  oz: 0.035274,
  lb: 0.0022046,
};

const WEIGHT_DECIMALS: Record<WeightUnit, number> = {
  g: 0,
  kg: 3,
  oz: 2,
  lb: 3,
};

const ENERGY_FACTORS: Record<EnergyUnit, number> = {
  kcal: 1,
  kJ: 4.184,
};

// ────────────────────────────────────────────────────────────────────────────
// Public helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Convert a weight stored in grams to the user's preferred display unit.
 * Returns a formatted string e.g. "1.200 kg", "500 g", "2.65 lb"
 */
export function displayWeight(grams: number, unit: WeightUnit): string {
  const converted = grams * WEIGHT_FACTORS[unit];
  return `${converted.toFixed(WEIGHT_DECIMALS[unit])} ${unit}`;
}

/**
 * Convert a volume stored in ml to the user's preferred display unit.
 * Volume is always shown in ml (we only support g/kg/oz/lb for weight),
 * so this just formats the number nicely.
 */
export function displayVolume(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(2)} L`;
  return `${ml} ml`;
}

/**
 * Convert a calorie value stored in kcal to the user's preferred energy unit.
 * Returns a formatted string e.g. "320 kcal", "1 339 kJ"
 */
export function displayEnergy(kcal: number, unit: EnergyUnit): string {
  const converted = kcal * ENERGY_FACTORS[unit];
  return converted ? `${Math.round(converted)} ${unit}` : `- kcal`;
}

/**
 * Generic display helper that routes to the correct converter based on the
 * item's SI unit stored in the database.
 *
 * @param value        Raw value from DB (always in SI)
 * @param siUnit       The SI unit stored in the DB ('g' | 'ml' | 'pcs')
 * @param weightUnit   The user's preferred weight unit from SettingsContext
 */
export function displayStock(
  value: number,
  siUnit: SIUnit | string,
  weightUnit: WeightUnit,
): string {
  switch (siUnit) {
    case 'g':
      return displayWeight(value, weightUnit);
    case 'ml':
      return displayVolume(value);
    case 'pcs':
      return `${value.toFixed(2)} pcs`;
    default:
      if (typeof (value) === 'string') {
        return `${parseFloat(value).toFixed(2)} ${siUnit}`;;
      }
      // Fallback for any legacy / unknown unit — show raw
      return `${value.toFixed()} ${siUnit}`;
  }
}

/**
 * Convert a user-entered value from their preferred display unit back to grams
 * for storage in the DB.  Only relevant for weight inputs.
 */
export function toSIWeight(value: number, fromUnit: WeightUnit): number {
  return Math.round(value / WEIGHT_FACTORS[fromUnit]);
}

/**
 * Normalise a free-text unit string to its canonical SI form.
 * Used when accepting unit input from forms / the AI.
 *
 *   'kg', 'KG', 'kilogram' → 'g'   (we store everything in g)
 *   'litre', 'liter', 'L'  → 'ml'
 *   'piece', 'count', 'ea' → 'pcs'
 *   already canonical       → returned as-is
 */
export function normaliseUnit(raw: string): SIUnit {
  const u = raw.trim().toLowerCase();

  if (['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds'].includes(u)) {
    return 'g';
  }

  if (['ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters', 'l', 'litre', 'liter', 'litres', 'liters'].includes(u)) {
    return 'ml';
  }

  if (['pcs', 'pc', 'piece', 'pieces', 'count', 'ea', 'each', 'unit', 'units', 'item', 'items', 'pkg', 'pack', 'packs'].includes(u)) {
    return 'pcs';
  }

  return 'g';
}

/**
 * Convert an incoming stock value to SI before writing to the DB.
 * e.g. user enters "2 kg" → store 2000 (g)
 */
export function toSIStock(value: number, fromUnit: string): number {
  const norm = fromUnit.trim().toLowerCase();

  switch (norm) {
    case 'kg': return Math.round(value * 1000);
    case 'oz': return Math.round(value * 28.3495);
    case 'lb': return Math.round(value * 453.592);
    case 'l':
    case 'litre':
    case 'liter': return Math.round(value * 1000);
    default: return Math.round(value);
  }
}

/**
 * Returns the human-readable label for the SI unit of a given item,
 * used in form placeholders / column headers.
 */
export function siUnitLabel(siUnit: SIUnit | string): string {
  switch (siUnit) {
    case 'g': return 'grams (g)';
    case 'ml': return 'millilitres (ml)';
    case 'pcs': return 'pieces (pcs)';
    default: return siUnit;
  }
}