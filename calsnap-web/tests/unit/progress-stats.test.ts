import { describe, expect, it } from 'vitest';
import type { UserProfile } from '@/lib/models/user-profile';
import type { WeighIn } from '@/lib/models/weigh-in';
import {
  compareWeighInsByRecency,
  currentWeightKg,
  deriveProgressStats,
  lostSoFarKg,
  progressFraction,
  sortWeighInsNewestFirst,
  toGoalKg,
} from '@/lib/progress/progress-stats';

function makeProfile(): UserProfile {
  return {
    id: 'user-1',
    name: 'Alex',
    sex: 'male',
    dateOfBirth: new Date(1991, 5, 14),
    heightCm: 178,
    startingWeightKg: 80,
    goalWeightKg: 72,
    goalTargetDate: new Date(2026, 11, 27),
    activityLevel: 'moderatelyActive',
    dailyCalorieTarget: 2285,
    tdee: 2635,
    deficitKcal: 350,
    macroTargetProteinPct: 0.28,
    macroTargetCarbsPct: 0.47,
    macroTargetFatPct: 0.25,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

describe('progress-stats', () => {
  it('currentWeightKg uses latest weigh-in by date', () => {
    const userId = 'user-1';
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: new Date('2026-06-01'), weightKg: 80 },
      { id: '2', userId, date: new Date('2026-06-20'), weightKg: 78 },
    ];
    expect(currentWeightKg(weighIns, 80)).toBe(78);
  });

  it('lostSoFarKg and toGoalKg are non-negative', () => {
    expect(lostSoFarKg(80, 85)).toBe(0);
    expect(toGoalKg(70, 72)).toBe(0);
  });

  it('progressFraction is between 0 and 1', () => {
    expect(progressFraction(80, 72, 76)).toBeGreaterThanOrEqual(0);
    expect(progressFraction(80, 72, 76)).toBeLessThanOrEqual(1);
  });

  it('deriveProgressStats bundles chart and projection data', () => {
    const profile = makeProfile();
    const userId = 'user-1';
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: new Date('2026-06-01'), weightKg: 80 },
      { id: '2', userId, date: new Date('2026-06-20'), weightKg: 78 },
    ];
    const stats = deriveProgressStats(profile, weighIns, new Date('2026-06-27'));

    expect(stats.currentWeightKg).toBe(78);
    expect(stats.chartWeighInsAscending).toHaveLength(2);
    expect(stats.chartWeighInsAscending[0]?.date.getTime()).toBeLessThan(
      stats.chartWeighInsAscending[1]?.date.getTime() ?? 0,
    );
    expect(stats.projectionPoints.length).toBeGreaterThan(0);
  });

  it('currentWeightKg breaks same-day ties by createdAt', () => {
    const userId = 'user-1';
    const sameDay = new Date('2026-06-27');
    const weighIns: WeighIn[] = [
      {
        id: 'older',
        userId,
        date: sameDay,
        weightKg: 80,
        createdAt: new Date('2026-06-27T08:00:00'),
      },
      {
        id: 'newer',
        userId,
        date: sameDay,
        weightKg: 78,
        createdAt: new Date('2026-06-27T12:00:00'),
      },
    ];
    expect(currentWeightKg(weighIns, 80)).toBe(78);
    expect(compareWeighInsByRecency(weighIns[1], weighIns[0])).toBeLessThan(0);
  });

  it('sortWeighInsNewestFirst returns newest first', () => {
    const userId = 'user-1';
    const weighIns: WeighIn[] = [
      { id: 'old', userId, date: new Date('2026-05-01'), weightKg: 81 },
      { id: 'new', userId, date: new Date('2026-06-27'), weightKg: 78 },
    ];
    expect(sortWeighInsNewestFirst(weighIns)[0]?.id).toBe('new');
  });
});
