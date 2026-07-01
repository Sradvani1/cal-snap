import { describe, expect, it } from 'vitest';
import {
  computeGoalTargetDate,
  validateGoalBelowCurrent,
} from '@/lib/nutrition/goal-pathway';

describe('goal-pathway', () => {
  const bio = {
    heightCm: 178,
    dateOfBirth: new Date(1991, 5, 14),
    sex: 'male' as const,
    activityLevel: 'moderatelyActive' as const,
    goalWeightKg: 72,
    deficitKcal: 350,
  };

  it('validateGoalBelowCurrent requires goal below current', () => {
    expect(validateGoalBelowCurrent(72, 80)).toBe(true);
    expect(validateGoalBelowCurrent(80, 80)).toBe(false);
    expect(validateGoalBelowCurrent(85, 80)).toBe(false);
  });

  it('returns null at goal, zero deficit, or unreachable', () => {
    const referenceDate = new Date(2026, 5, 27);
    expect(
      computeGoalTargetDate({
        currentWeightKg: 72,
        ...bio,
        referenceDate,
      }),
    ).toBeNull();
    expect(
      computeGoalTargetDate({
        currentWeightKg: 80,
        ...bio,
        deficitKcal: 0,
        referenceDate,
      }),
    ).toBeNull();
  });

  it('computes a future date from onboarding anchor (today)', () => {
    const referenceDate = new Date(2026, 5, 27);
    const goalDate = computeGoalTargetDate({
      currentWeightKg: 80,
      ...bio,
      referenceDate,
    });

    expect(goalDate).not.toBeNull();
    expect(goalDate!.getTime()).toBeGreaterThan(referenceDate.getTime());
  });

  it('uses weigh-in date as reference anchor', () => {
    const weighInDate = new Date(2026, 3, 15);
    const today = new Date(2026, 5, 27);
    const fromWeighIn = computeGoalTargetDate({
      currentWeightKg: 78,
      ...bio,
      referenceDate: weighInDate,
    });
    const fromToday = computeGoalTargetDate({
      currentWeightKg: 78,
      ...bio,
      referenceDate: today,
    });

    expect(fromWeighIn).not.toBeNull();
    expect(fromToday).not.toBeNull();
    expect(fromWeighIn!.getTime()).toBeLessThan(fromToday!.getTime());
  });

  it('later referenceDate yields later goal date for same inputs', () => {
    const earlier = new Date(2026, 3, 1);
    const later = new Date(2026, 8, 1);
    const fromEarlier = computeGoalTargetDate({
      currentWeightKg: 80,
      ...bio,
      referenceDate: earlier,
    });
    const fromLater = computeGoalTargetDate({
      currentWeightKg: 80,
      ...bio,
      referenceDate: later,
    });

    expect(fromEarlier).not.toBeNull();
    expect(fromLater).not.toBeNull();
    expect(fromLater!.getTime()).toBeGreaterThan(fromEarlier!.getTime());
  });
});
