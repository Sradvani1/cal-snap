import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { WeighIn } from '@/lib/models/weigh-in';
import { bmi, projectedGoalDate, projectionPoints, weeklyLossRateKg } from '@/lib/nutrition/calculator';
import { computeGoalTargetDate } from '@/lib/nutrition/goal-pathway';
import { updateProfileAfterWeighIn } from '@/lib/repositories/profile';
import {
  recalculateWeighIn,
  saveWeighIn,
} from '@/lib/services/weigh-in-service';
import {
  currentWeightKg,
  lostSoFarKg,
  progressFraction,
  sortWeighInsNewestFirst,
  toGoalKg,
} from '@/lib/progress/progress-stats';
import { setUseLbsConvertsWeight } from '@/lib/progress/use-weigh-in-form';

const { mockWriteBatch, mockDoc } = vi.hoisted(() => ({
  mockWriteBatch: vi.fn(),
  mockDoc: vi.fn(() => ({ path: 'mock-doc' })),
}));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    writeBatch: mockWriteBatch,
    doc: mockDoc,
  };
});

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
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
    ...overrides,
  };
}

function makeExtras(): ProfileExtras {
  return {
    onboardingCompleted: true,
    currentWeightKg: 80,
    useLbsForWeight: false,
    useImperialForHeight: false,
  };
}

describe('weigh-in service', () => {
  beforeEach(() => {
    mockWriteBatch.mockReset();
    mockDoc.mockReset();
    mockDoc.mockReturnValue({ path: 'mock-doc' });
  });

  it('recalculateWeighIn lowers TDEE and target when weight drops', () => {
    const profile = makeProfile();
    const before = recalculateWeighIn(profile, 80);
    const after = recalculateWeighIn(profile, 78);

    expect(after.tdee).toBeLessThan(before.tdee);
    expect(after.dailyTarget).toBeLessThan(before.dailyTarget);
    expect(after.deficitKcal).toBe(profile.deficitKcal);
  });

  it('recalculateWeighIn snapshot BMI in plausible range', () => {
    const profile = makeProfile();
    const result = recalculateWeighIn(profile, 78);

    expect(result.bmi).toBeGreaterThanOrEqual(24);
    expect(result.bmi).toBeLessThanOrEqual(25);
    expect(result.bmi).toBeCloseTo(bmi(78, 178), 1);
  });

  it('saveWeighIn returns didTriggerPlateau for 3 weekly flat weigh-ins', async () => {
    const profile = makeProfile();
    const extras = makeExtras();
    const uid = 'user-1';
    const today = new Date('2026-06-27T12:00:00');
    const twoWeeksAgo = new Date('2026-06-13T12:00:00');
    const oneWeekAgo = new Date('2026-06-20T12:00:00');

    const plateauWeighIns: WeighIn[] = [
      { id: '1', userId: uid, date: twoWeeksAgo, weightKg: 80 },
      { id: '2', userId: uid, date: oneWeekAgo, weightKg: 80 },
      { id: '3', userId: uid, date: today, weightKg: 80 },
    ];

    const commit = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn();
    mockWriteBatch.mockReturnValue({ set, commit });

    const result = await saveWeighIn(
      {
        uid,
        profile,
        profileExtras: extras,
        newWeightKg: 80,
        date: today,
      },
      {
        db: {} as never,
        fetchWeeklyPlateauWeighIns: vi.fn().mockResolvedValue(plateauWeighIns),
      },
    );

    expect(commit).toHaveBeenCalled();
    expect(result.didTriggerPlateau).toBe(true);
    expect(result.weighIn.weightKg).toBe(80);
    expect(result.updatedProfile.tdee).toBe(result.weighIn.calculatedTDEE);
  });

  it('updateProfileAfterWeighIn sets current weight, targets, and goal date', () => {
    const profile = makeProfile();
    const extras = makeExtras();
    const recalc = recalculateWeighIn(profile, 78);
    const weighInDate = new Date('2026-06-20T12:00:00');
    const goalTargetDate = computeGoalTargetDate({
      currentWeightKg: 78,
      goalWeightKg: profile.goalWeightKg,
      heightCm: profile.heightCm,
      dateOfBirth: profile.dateOfBirth,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      deficitKcal: recalc.deficitKcal,
      referenceDate: weighInDate,
    });
    const updated = updateProfileAfterWeighIn(
      profile,
      extras,
      78,
      recalc,
      goalTargetDate,
    );

    expect(updated.extras.currentWeightKg).toBe(78);
    expect(updated.profile.tdee).toBe(recalc.tdee);
    expect(updated.profile.dailyCalorieTarget).toBe(recalc.dailyTarget);
    expect(updated.profile.goalTargetDate?.getTime()).toBe(goalTargetDate?.getTime());
  });

  it('updateProfileAfterWeighIn clears goalTargetDate at goal weight', () => {
    const profile = makeProfile({ goalWeightKg: 72 });
    const extras = makeExtras();
    const recalc = recalculateWeighIn(profile, 72);

    const updated = updateProfileAfterWeighIn(profile, extras, 72, recalc, null);

    expect(updated.profile.goalTargetDate).toBeNull();
    expect(updated.profile.startingWeightKg).toBe(profile.startingWeightKg);
  });
});

describe('weigh-in form unit conversion', () => {
  it('setUseLbs converts weight without changing kg value', () => {
    const toLbs = setUseLbsConvertsWeight(80, false, true);
    expect(toLbs.kg).toBeCloseTo(80, 0);

    const backToKg = setUseLbsConvertsWeight(toLbs.kg, true, false);
    expect(backToKg.kg).toBeCloseTo(80, 0);
  });
});

describe('calculator weigh-in derivations', () => {
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

  it('projectionPoints reaches goal weight', () => {
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
    expect(points[points.length - 1]?.weightKg ?? Infinity).toBeLessThanOrEqual(72.5);
  });

  it('projectedGoalDate is future and weeks in 14–30 range', () => {
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

  it('progressFraction clamps 0–1', () => {
    expect(progressFraction(80, 72, 90)).toBe(0);
    expect(progressFraction(80, 72, 72)).toBe(1);
    expect(progressFraction(80, 72, 76)).toBeCloseTo(0.5, 1);
  });
});

describe('progress stats helpers', () => {
  it('currentWeightKg falls back to startingWeightKg', () => {
    expect(currentWeightKg([], 80)).toBe(80);
  });

  it('lostSoFarKg and toGoalKg are non-negative', () => {
    expect(lostSoFarKg(80, 85)).toBe(0);
    expect(toGoalKg(70, 72)).toBe(0);
    expect(lostSoFarKg(80, 75)).toBe(5);
    expect(toGoalKg(75, 72)).toBe(3);
  });

  it('sortWeighInsNewestFirst orders by date descending', () => {
    const userId = 'user-1';
    const weighIns: WeighIn[] = [
      { id: '1', userId, date: new Date('2026-06-01'), weightKg: 80 },
      { id: '2', userId, date: new Date('2026-06-20'), weightKg: 79 },
      { id: '3', userId, date: new Date('2026-06-10'), weightKg: 79.5 },
    ];
    const sorted = sortWeighInsNewestFirst(weighIns);
    expect(sorted.map((entry) => entry.id)).toEqual(['2', '3', '1']);
  });
});
