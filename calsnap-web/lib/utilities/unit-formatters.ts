export const LBS_PER_KG = 2.2046226218;
export const CM_PER_INCH = 2.54;

export const WEIGHT_RANGE_LBS = { min: 80, max: 400 } as const;
export const WEIGHT_RANGE_KG = { min: 35, max: 180 } as const;
export const HEIGHT_RANGE_CM = { min: 120, max: 230 } as const;

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

export function weightDisplayRange(useLbs: boolean): { min: number; max: number } {
  return useLbs ? WEIGHT_RANGE_LBS : WEIGHT_RANGE_KG;
}

export function weightDisplayStep(): number {
  return 0.1;
}

export function snappedDisplayWeight(value: number, useLbs: boolean): number {
  const range = weightDisplayRange(useLbs);
  const clamped = Math.min(Math.max(value, range.min), range.max);
  return Math.round(clamped * 10) / 10;
}

export function displayWeight(fromKg: number, useLbs: boolean): number {
  return snappedDisplayWeight(useLbs ? kgToLbs(fromKg) : fromKg, useLbs);
}

export function kgFromDisplayWeight(display: number, useLbs: boolean): number {
  return useLbs ? lbsToKg(display) : display;
}

export function weightInputHandlers(useLbs: boolean) {
  return {
    formatDisplay: (kg: number) => String(displayWeight(kg, useLbs)),
    commitValue: (display: number) => snappedDisplayWeight(display, useLbs),
    toKg: (display: number) => kgFromDisplayWeight(display, useLbs),
  };
}

export function validateWeightKg(kg: number): boolean {
  return (
    Number.isFinite(kg) &&
    kg > 0 &&
    kg >= WEIGHT_RANGE_KG.min &&
    kg <= WEIGHT_RANGE_KG.max
  );
}

export function normalizeWeightKg(kg: number, useLbs = false): number {
  const display = snappedDisplayWeight(useLbs ? kgToLbs(kg) : kg, useLbs);
  return kgFromDisplayWeight(display, useLbs);
}

export function validateHeightCm(cm: number): boolean {
  return (
    Number.isFinite(cm) &&
    cm >= HEIGHT_RANGE_CM.min &&
    cm <= HEIGHT_RANGE_CM.max
  );
}

export function normalizeHeightCm(cm: number): number {
  return Math.min(
    HEIGHT_RANGE_CM.max,
    Math.max(HEIGHT_RANGE_CM.min, Math.round(cm)),
  );
}

export function clampFeet(value: number): number {
  return Math.min(8, Math.max(4, value));
}

export function clampInches(value: number): number {
  return Math.min(11, Math.max(0, value));
}

export function normalizeHeightCmFromFeetInches(feet: number, inches: number): number {
  return normalizeHeightCm(feetInchesToCm(clampFeet(feet), clampInches(inches)));
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

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
