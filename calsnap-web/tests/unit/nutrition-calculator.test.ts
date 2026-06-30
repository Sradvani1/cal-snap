import { describe, expect, it } from 'vitest';
import {
  ageFromDateOfBirth,
  bmi,
  bmr,
  dailyTarget,
  fiberTargetG,
  isOnPlateau,
  macroPercents,
  macroTargets,
  projectedGoalDate,
  projectionPoints,
  tdee,
  weeklyLossRateKg,
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

  it('macroPercents from macroTargets output', () => {
    const macros = macroTargets(2000, 0.28, 0.47, 0.25);
    const percents = macroPercents(macros.proteinG, macros.carbsG, macros.fatG);

    expect(percents.proteinPct).toBe(28);
    expect(percents.carbsPct).toBe(47);
    expect(percents.fatPct).toBe(25);
  });

  it('macroPercents returns zeros when total kcal is zero', () => {
    expect(macroPercents(0, 0, 0)).toEqual({
      proteinPct: 0,
      carbsPct: 0,
      fatPct: 0,
    });
  });

  it('fiberTargetG at 2000 kcal', () => {
    expect(fiberTargetG(2000)).toBe(28);
  });

  it('weeklyLossRateKg returns null with fewer than two weigh-ins', () => {
    expect(
      weeklyLossRateKg([{ id: '1', userId: 'user-1', date: new Date('2026-06-27'), weightKg: 80 }]),
    ).toBeNull();
  });

  it('weeklyLossRateKg from two weigh-ins 7 days apart', () => {
    const userId = 'user-1';
    const today = new Date('2026-06-27');
    const oneWeekAgo = new Date('2026-06-20');
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: oneWeekAgo, weightKg: 80 },
      { id: '2', userId, date: today, weightKg: 79 },
    ];

    const rate = weeklyLossRateKg(weighIns);
    expect(rate).not.toBeNull();
    expect(rate ?? 0).toBeCloseTo(1, 0);
  });

  it('projectedGoalDate returns null at goal or zero deficit', () => {
    const referenceDate = new Date('2026-06-27');
    expect(
      projectedGoalDate(72, 72, 178, 35, 'male', 'moderatelyActive', 350, referenceDate),
    ).toBeNull();
    expect(
      projectedGoalDate(80, 72, 178, 35, 'male', 'moderatelyActive', 0, referenceDate),
    ).toBeNull();
  });

  it('projectedGoalDate is future with weeks in 14–30 range', () => {
    const referenceDate = new Date('2026-06-27');
    const projected = projectedGoalDate(
      80,
      72,
      178,
      35,
      'male',
      'moderatelyActive',
      350,
      referenceDate,
    );

    expect(projected).not.toBeNull();
    if (!projected) {
      return;
    }

    expect(projected.getTime()).toBeGreaterThan(referenceDate.getTime());
    const weeks = Math.round(
      (projected.getTime() - referenceDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    expect(weeks).toBeGreaterThanOrEqual(14);
    expect(weeks).toBeLessThanOrEqual(30);
  });

  it('projectionPoints returns empty array when deficit is zero', () => {
    expect(projectionPoints(80, 72, 178, 35, 'male', 'moderatelyActive', 0)).toEqual([]);
  });

  it('projectionPoints reaches goal weight from fixed start date', () => {
    const startDate = new Date('2026-06-27');
    const points = projectionPoints(
      74,
      72,
      178,
      35,
      'male',
      'moderatelyActive',
      350,
      startDate,
    );

    expect(points.length).toBeGreaterThan(0);
    expect(points[0]?.date.getTime()).toBe(startDate.getTime());
    expect(points[points.length - 1]?.weightKg ?? Infinity).toBeLessThanOrEqual(72.5);
  });
});
