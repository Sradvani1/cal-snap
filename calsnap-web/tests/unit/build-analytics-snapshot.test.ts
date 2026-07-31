import { describe, expect, it } from 'vitest';
import { buildAnalyticsSnapshot } from '@/lib/analytics/build-analytics-snapshot';
import { AnalyticsDateRange } from '@/lib/analytics/analytics-types';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import type { FoodItem } from '@/lib/models/food-item';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { UserProfile } from '@/lib/models/user-profile';

const REFERENCE = new Date(2026, 5, 15);

function makeMeal(
  overrides: Partial<MealEntry> & Pick<MealEntry, 'timestamp' | 'totalCalories'>,
): MealEntry {
  return {
    id: overrides.id ?? 'meal-1',
    userId: overrides.userId ?? 'user-1',
    timestamp: overrides.timestamp,
    mealType: overrides.mealType ?? 'lunch',
    totalCalories: overrides.totalCalories,
    totalProteinG: overrides.totalProteinG ?? 0,
    totalCarbsG: overrides.totalCarbsG ?? 0,
    totalFatG: overrides.totalFatG ?? 0,
    totalSaturatedFatG: overrides.totalSaturatedFatG ?? 0,
    totalUnsaturatedFatG: overrides.totalUnsaturatedFatG ?? 0,
    totalFiberG: overrides.totalFiberG ?? 0,
    geminiConfidence: overrides.geminiConfidence ?? 0.9,
    isManuallyAdjusted: overrides.isManuallyAdjusted ?? false,
    items: overrides.items ?? [],
  };
}

function makeFood(name: string, calories: number): FoodItem {
  return {
    id: `${name}-id`,
    name,
    estimatedWeightG: 100,
    calories,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    saturatedFatG: 0,
    unsaturatedFatG: 0,
    fiberG: 0,
    confidence: 0.9,
    isFlagged: false,
  };
}

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const now = new Date();
  return {
    id: 'user-1',
    name: 'Alex',
    sex: 'female',
    dateOfBirth: new Date(1990, 0, 1),
    heightCm: 165,
    startingWeightKg: 70,
    goalWeightKg: 60,
    goalTargetDate: new Date(2027, 0, 1),
    activityLevel: 'moderatelyActive',
    dailyCalorieTarget: 2000,
    tdee: 2350,
    deficitKcal: 350,
    macroTargetProteinPct: 0.28,
    macroTargetCarbsPct: 0.47,
    macroTargetFatPct: 0.25,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildSnapshot(
  meals: MealEntry[],
  range: Parameters<typeof buildAnalyticsSnapshot>[0]['range'],
) {
  return buildAnalyticsSnapshot({
    meals,
    profile: makeProfile(),
    range,
    weighInsInRange: [],
    referenceDate: REFERENCE,
  });
}

function localDayKeyOf(date: Date): number {
  return startOfLocalDay(date).getTime();
}

describe('buildAnalyticsSnapshot window bounds', () => {
  it('custom range in the past excludes meals before rangeStart', () => {
    const snapshot = buildSnapshot(
      [
        makeMeal({
          timestamp: new Date(2026, 5, 7, 12),
          totalCalories: 500,
          items: [makeFood('Oatmeal', 500)],
        }),
        makeMeal({
          timestamp: new Date(2026, 5, 8, 12),
          totalCalories: 1000,
          items: [makeFood('Chicken', 1000)],
        }),
        makeMeal({
          timestamp: new Date(2026, 5, 10, 12),
          totalCalories: 2000,
          items: [makeFood('Rice', 2000)],
        }),
      ],
      AnalyticsDateRange.custom(new Date(2026, 5, 8), new Date(2026, 5, 14)),
    );

    expect(snapshot.loggedDayCount).toBe(2);
    expect(snapshot.averageDailyCalories).toBe(1500);
    expect(snapshot.loggedDays.map((day) => day.date.getTime())).not.toContain(
      localDayKeyOf(new Date(2026, 5, 7)),
    );
    expect(snapshot.topFoods.map((food) => food.name)).not.toContain('Oatmeal');
    expect(snapshot.chartDailySeries).toHaveLength(7);
  });

  it('custom range ending today excludes today and the day before rangeStart', () => {
    const snapshot = buildSnapshot(
      [
        makeMeal({ timestamp: new Date(2026, 5, 7, 12), totalCalories: 400 }),
        makeMeal({ timestamp: new Date(2026, 5, 8, 12), totalCalories: 1000 }),
        makeMeal({ timestamp: new Date(2026, 5, 14, 12), totalCalories: 1500 }),
        makeMeal({ timestamp: new Date(2026, 5, 15, 12), totalCalories: 999 }),
      ],
      AnalyticsDateRange.custom(new Date(2026, 5, 8), new Date(2026, 5, 15)),
    );

    expect(snapshot.loggedDayCount).toBe(2);
    expect(snapshot.averageDailyCalories).toBe(1250);
    const loggedDayTimes = snapshot.loggedDays.map((day) => day.date.getTime());
    expect(loggedDayTimes).not.toContain(localDayKeyOf(new Date(2026, 5, 7)));
    expect(loggedDayTimes).not.toContain(localDayKeyOf(new Date(2026, 5, 15)));
  });

  it('preset 7d keeps the full window and excludes out-of-window meals', () => {
    const snapshot = buildSnapshot(
      [
        makeMeal({ timestamp: new Date(2026, 5, 7, 12), totalCalories: 400 }),
        makeMeal({ timestamp: new Date(2026, 5, 8, 12), totalCalories: 1000 }),
        makeMeal({ timestamp: new Date(2026, 5, 14, 12), totalCalories: 1500 }),
        makeMeal({ timestamp: new Date(2026, 5, 15, 12), totalCalories: 999 }),
      ],
      AnalyticsDateRange.days(7),
    );

    expect(snapshot.loggedDayCount).toBe(2);
    expect(snapshot.averageDailyCalories).toBe(1250);
    expect(snapshot.chartDailySeries).toHaveLength(7);
    expect(snapshot.loggedDays.map((day) => day.date.getTime())).not.toContain(
      localDayKeyOf(new Date(2026, 5, 7)),
    );
  });

  it('preset 30d keeps the first window day', () => {
    const snapshot = buildSnapshot(
      [
        makeMeal({ timestamp: new Date(2026, 4, 15, 12), totalCalories: 400 }),
        makeMeal({ timestamp: new Date(2026, 4, 16, 12), totalCalories: 1000 }),
        makeMeal({ timestamp: new Date(2026, 5, 14, 12), totalCalories: 1500 }),
      ],
      AnalyticsDateRange.days(30),
    );

    expect(snapshot.loggedDayCount).toBe(2);
    expect(snapshot.averageDailyCalories).toBe(1250);
    const loggedDayTimes = snapshot.loggedDays.map((day) => day.date.getTime());
    expect(loggedDayTimes).not.toContain(localDayKeyOf(new Date(2026, 4, 15)));
    expect(loggedDayTimes).toContain(localDayKeyOf(new Date(2026, 4, 16)));
  });
});
