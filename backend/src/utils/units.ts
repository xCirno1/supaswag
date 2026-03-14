export type SIUnit = 'g' | 'ml' | 'pcs';

/**
 * Normalise a free-text unit string to its canonical SI form.
 */
export function normaliseUnit(raw: string): SIUnit {
  const u = raw.trim().toLowerCase();

  if (['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
    'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds'].includes(u)) {
    return 'g';
  }

  if (['ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters',
    'l', 'litre', 'liter', 'litres', 'liters'].includes(u)) {
    return 'ml';
  }

  if (['pcs', 'pc', 'piece', 'pieces', 'count', 'ea', 'each',
    'unit', 'units', 'item', 'items', 'pkg', 'pack', 'packs'].includes(u)) {
    return 'pcs';
  }

  return 'g'; // safe default for a food system
}

/**
 * Convert an incoming stock value to SI before writing to the DB.
 */
export function toSIStock(value: number, fromUnit: string): number {
  const u = fromUnit.trim().toLowerCase();
  switch (u) {
    case 'kg': return Math.round(value * 1000);
    case 'oz': return Math.round(value * 28.3495);
    case 'lb': case 'lbs': return Math.round(value * 453.592);
    case 'l': case 'litre': case 'liter': return Math.round(value * 1000);
    default: return Math.round(value); // g, ml, pcs already SI
  }
}

/**
 * Build a human-readable quantity string for AI prompts.
 * e.g. formatForAI(500, 'g') → "500 g"
 */
export function formatForAI(value: number, siUnit: SIUnit): string {
  return `${value} ${siUnit}`;
}

/** Allowed SI units — used for validation in controllers. */
export const VALID_SI_UNITS: readonly SIUnit[] = ['g', 'ml', 'pcs'] as const;

export function isValidSIUnit(u: string): u is SIUnit {
  return VALID_SI_UNITS.includes(u as SIUnit);
}