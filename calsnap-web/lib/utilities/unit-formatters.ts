export const LBS_PER_KG = 2.2046226218;
export const CM_PER_INCH = 2.54;

export const WEIGHT_RANGE_LBS = { min: 80, max: 400 } as const;
export const WEIGHT_RANGE_KG = { min: 35, max: 180 } as const;

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

export function weightDisplayRange(useLbs: boolean): { min: number; max: number } {
  return useLbs ? WEIGHT_RANGE_LBS : WEIGHT_RANGE_KG;
}

export function weightDisplayStep(useLbs: boolean): number {
  return useLbs ? 1 : 0.5;
}

export function snappedDisplayWeight(value: number, useLbs: boolean): number {
  const range = weightDisplayRange(useLbs);
  const clamped = Math.min(Math.max(value, range.min), range.max);
  if (useLbs) {
    return Math.round(clamped);
  }
  return Math.round(clamped * 2) / 2;
}

export function displayWeight(fromKg: number, useLbs: boolean): number {
  return snappedDisplayWeight(useLbs ? kgToLbs(fromKg) : fromKg, useLbs);
}

export function kgFromDisplayWeight(display: number, useLbs: boolean): number {
  return useLbs ? lbsToKg(display) : display;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches) - feet * 12;
  return { feet, inches: Math.max(0, Math.min(inches, 11)) };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export function formatWeight(kg: number, useLbs: boolean): string {
  if (useLbs) {
    return `${kgToLbs(kg).toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatHeight(cm: number, useImperial: boolean): string {
  if (useImperial) {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}' ${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatMacroGrams(grams: number, fractionLength = 0): string {
  return `${grams.toFixed(fractionLength)} g`;
}
