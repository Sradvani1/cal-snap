import { describe, expect, it } from 'vitest';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgFromDisplayWeight,
  lbsToKg,
  normalizeHeightCm,
  normalizeWeightKg,
  snappedDisplayWeight,
  validateHeightCm,
  validateWeightKg,
  weightInputHandlers,
} from '@/lib/utilities/unit-formatters';

describe('unit-formatters weight input', () => {
  it('does not clamp intermediate display values below the minimum', () => {
    expect(snappedDisplayWeight(17, true)).toBe(80);
    expect(snappedDisplayWeight(176, true)).toBe(176);
  });

  it('round-trips kg through display weight handlers', () => {
    const handlers = weightInputHandlers(true);
    const display = handlers.formatDisplay(90.7185);
    expect(display).toBe('200');
    const kg = handlers.toKg(handlers.commitValue(Number(display)));
    expect(kg).toBeCloseTo(90.7185, 2);
  });

  it('converts snapped lbs display back to kg', () => {
    const snapped = snappedDisplayWeight(200, true);
    expect(kgFromDisplayWeight(snapped, true)).toBeCloseTo(90.7185, 2);
  });
});

describe('unit-formatters height', () => {
  it('round-trips feet and inches through cm', () => {
    const cm = feetInchesToCm(5, 5);
    const { feet, inches } = cmToFeetInches(cm);
    expect(feet).toBe(5);
    expect(inches).toBe(5);
  });

  it('supports single-digit inches', () => {
    const cm = feetInchesToCm(6, 2);
    const { feet, inches } = cmToFeetInches(cm);
    expect(feet).toBe(6);
    expect(inches).toBe(2);
  });
});

describe('unit-formatters normalization', () => {
  it('clamps partial height entries to the allowed range', () => {
    expect(normalizeHeightCm(18)).toBe(120);
    expect(normalizeHeightCm(185)).toBe(185);
    expect(validateHeightCm(185)).toBe(true);
    expect(validateHeightCm(18)).toBe(false);
  });

  it('clamps partial weight entries to the allowed range', () => {
    expect(normalizeWeightKg(7.7)).toBe(35);
    expect(normalizeWeightKg(80)).toBe(80);
    expect(validateWeightKg(80)).toBe(true);
    expect(validateWeightKg(7.7)).toBe(false);
  });

  it('normalizes lbs-entered weights through the display unit', () => {
    const kg = normalizeWeightKg(lbsToKg(200), true);
    expect(kg).toBeCloseTo(lbsToKg(200), 2);
  });
});
