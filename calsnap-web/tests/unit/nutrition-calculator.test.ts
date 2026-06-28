import { describe, expect, it } from 'vitest';
import {
  ageFromDateOfBirth,
  bmi,
  bmr,
  dailyTarget,
  isOnPlateau,
  macroTargets,
  tdee,
  weightProjection,
} from '@/lib/nutrition/calculator';
import type { WeighIn } from '@/lib/models/weigh-in';

describe('NutritionCalculator', () => {
  it('bmr male', () => {
    expect(Math.abs(bmr(80, 178, 51, 'male') - 1663)).toBeLessThanOrEqual(1);
  });

  it('bmr female', () => {
    expect(Math.abs(bmr(65, 163, 48, 'female') - 1268)).toBeLessThanOrEqual(1);
  });

  it('tdee', () => {
    expect(tdee(1700, 'moderatelyActive')).toBeCloseTo(2635, 0);
  });

  it('dailyTarget floor', () => {
    const result = dailyTarget(2000, 1000, 'male');
    expect(result.target).toBe(1500);
    expect(result.deficit).toBe(750);
    expect(result.warnings.some((warning) => warning.includes('1500'))).toBe(true);
  });

  it('dailyTarget warnings', () => {
    const result = dailyTarget(3000, 800, 'male');
    expect(result.deficit).toBe(750);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.some((warning) => warning.includes('750'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('500'))).toBe(true);
  });

  it('macroTargets', () => {
    const macros = macroTargets(2000, 0.28, 0.47, 0.25);
    expect(macros.proteinG).toBeCloseTo(140, 0);
    expect(macros.carbsG).toBeCloseTo(235, 0);
    expect(macros.fatG).toBeCloseTo(55.6, 0);
  });

  it('bmi', () => {
    expect(bmi(80, 178)).toBeCloseTo(25.2, 1);
  });

  it('ageFromDateOfBirth', () => {
    const referenceDate = new Date(2026, 5, 14);
    const dob = new Date(1991, 5, 14);
    expect(ageFromDateOfBirth(dob, referenceDate)).toBe(35);
  });

  it('isOnPlateau', () => {
    const userId = 'user-1';
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: new Date(), weightKg: 80.0 },
      { id: '2', userId, date: new Date(), weightKg: 80.1 },
      { id: '3', userId, date: new Date(), weightKg: 80.15 },
    ];
    expect(isOnPlateau(weighIns)).toBe(true);
  });

  it('isOnPlateau insufficient weigh-ins', () => {
    const userId = 'user-1';
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: new Date(), weightKg: 80.0 },
      { id: '2', userId, date: new Date(), weightKg: 80.1 },
    ];
    expect(isOnPlateau(weighIns)).toBe(false);
  });

  it('isOnPlateau spread too large', () => {
    const userId = 'user-1';
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: new Date(), weightKg: 80.0 },
      { id: '2', userId, date: new Date(), weightKg: 80.15 },
      { id: '3', userId, date: new Date(), weightKg: 80.25 },
    ];
    expect(isOnPlateau(weighIns)).toBe(false);
  });

  it('isOnPlateau unsorted input', () => {
    const userId = 'user-1';
    const day1 = new Date(2026, 5, 14);
    const day2 = new Date(2026, 5, 7);
    const day3 = new Date(2026, 4, 31);
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: day2, weightKg: 80.1 },
      { id: '2', userId, date: day1, weightKg: 80.15 },
      { id: '3', userId, date: day3, weightKg: 79.0 },
      { id: '4', userId, date: day2, weightKg: 80.05 },
    ];
    expect(isOnPlateau(weighIns)).toBe(true);
  });

  it('weightProjection', () => {
    const results = weightProjection(
      80,
      178,
      35,
      'male',
      'moderatelyActive',
      350,
      12,
    );

    expect(results).toHaveLength(13);
    for (let index = 1; index < results.length; index += 1) {
      expect(results[index].weightKg).toBeLessThan(results[index - 1].weightKg);
    }
  });
});
