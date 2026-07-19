import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import {
  calorieProgressBand,
  fiberProgressBand,
  fiberTargetForDailyCalories,
  remainingCalories,
} from '@/lib/dashboard/calorie-progress';
import {
  applyDietBreakTargets,
  applySmallReductionTargets,
  isMaintenanceModeActive,
  isPlateauSnoozed,
  maintenanceModeKey,
  plateauSnoozeKey,
  shouldShowPlateauAlert,
  storeDate,
} from '@/lib/dashboard/plateau-state';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { UserProfile } from '@/lib/models/user-profile';
import type { WeighIn } from '@/lib/models/weigh-in';
import { AppConstants } from '@/lib/constants';

function makeMeal(
  overrides: Partial<MealEntry> & Pick<MealEntry, 'mealType' | 'totalCalories'>,
): MealEntry {
  return {
    id: overrides.id ?? 'meal-1',
    userId: overrides.userId ?? 'user-1',
    timestamp: overrides.timestamp ?? new Date(),
    mealType: overrides.mealType,
    totalCalories: overrides.totalCalories,
    totalProteinG: overrides.totalProteinG ?? 0,
    totalCarbsG: overrides.totalCarbsG ?? 0,
    totalFatG: overrides.totalFatG ?? 0,
    totalFiberG: overrides.totalFiberG ?? 0,
    geminiConfidence: overrides.geminiConfidence ?? 0.9,
    isManuallyAdjusted: overrides.isManuallyAdjusted ?? false,
    items: overrides.items ?? [],
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

describe('dashboard aggregation', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
          removeItem: (key: string) => {
            storage.delete(key);
          },
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('sorts meals by timestamp within each meal type bucket', () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const earlier = new Date(startOfToday);
    earlier.setHours(12, 0, 0, 0);
    const later = new Date(startOfToday);
    later.setHours(13, 0, 0, 0);

    const result = aggregateTodaysMeals([
      makeMeal({ id: 'late', mealType: 'lunch', totalCalories: 600, timestamp: later }),
      makeMeal({ id: 'early', mealType: 'lunch', totalCalories: 400, timestamp: earlier }),
    ]);

    const lunchMeals = result.mealsByType.lunch ?? [];
    expect(lunchMeals.map((meal) => meal.totalCalories)).toEqual([400, 600]);
    expect(lunchMeals.map((meal) => meal.timestamp.getTime())).toEqual([
      earlier.getTime(),
      later.getTime(),
    ]);
  });

  it('aggregateTodaysMeals with 3 meals', () => {
    const meals = [
      makeMeal({
        id: '1',
        mealType: 'breakfast',
        totalCalories: 400,
        totalProteinG: 30,
        totalCarbsG: 40,
        totalFatG: 12,
        totalFiberG: 5,
      }),
      makeMeal({
        id: '2',
        mealType: 'lunch',
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 55,
        totalFatG: 20,
        totalFiberG: 8,
      }),
      makeMeal({
        id: '3',
        mealType: 'dinner',
        totalCalories: 500,
        totalProteinG: 40,
        totalCarbsG: 45,
        totalFatG: 18,
        totalFiberG: 6,
      }),
    ];

    const result = aggregateTodaysMeals(meals);

    expect(result.todaysCalories).toBe(1500);
    expect(result.todaysProteinG).toBe(105);
    expect(result.todaysCarbsG).toBe(140);
    expect(result.todaysFatG).toBe(50);
    expect(result.todaysFiberG).toBe(19);
    expect(result.mealsByType.breakfast).toHaveLength(1);
    expect(result.mealsByType.lunch).toHaveLength(1);
    expect(result.mealsByType.dinner).toHaveLength(1);
  });

  it('calorieProgressBand boundaries', () => {
    expect(calorieProgressBand(0.89)).toBe('under');
    expect(calorieProgressBand(0.95)).toBe('onTrack');
    expect(calorieProgressBand(1.15)).toBe('over');
  });

  it('remainingCalories with overage', () => {
    expect(remainingCalories(2300, 2000)).toBe(-300);
  });

  it('fiberTargetG at 2000 kcal', () => {
    expect(fiberTargetForDailyCalories(2000)).toBe(28);
  });

  it('fiberProgressBand thresholds', () => {
    expect(fiberProgressBand(26.6 / 28)).toBe('onTrack');
    expect(fiberProgressBand(21 / 28)).toBe('moderate');
    expect(fiberProgressBand(10 / 28)).toBe('low');
  });

  it('shouldShowPlateauAlert respects snooze, maintenance, and isOnPlateau', () => {
    const profile = makeProfile();
    const plateauWeighIns: WeighIn[] = [
      { id: '1', userId: 'user-1', date: new Date(), weightKg: 80 },
      { id: '2', userId: 'user-1', date: new Date(), weightKg: 80.1 },
      { id: '3', userId: 'user-1', date: new Date(), weightKg: 80.05 },
    ];

    expect(shouldShowPlateauAlert(profile, plateauWeighIns, 'user-1')).toBe(true);

    const snoozeEnd = new Date();
    snoozeEnd.setDate(snoozeEnd.getDate() + 14);
    storeDate(plateauSnoozeKey('user-1'), snoozeEnd);
    expect(shouldShowPlateauAlert(profile, plateauWeighIns, 'user-1')).toBe(false);
    window.localStorage.removeItem(plateauSnoozeKey('user-1'));

    const maintenanceEnd = new Date();
    maintenanceEnd.setDate(maintenanceEnd.getDate() + 14);
    storeDate(maintenanceModeKey('user-1'), maintenanceEnd);
    expect(shouldShowPlateauAlert(profile, plateauWeighIns, 'user-1')).toBe(false);
    window.localStorage.removeItem(maintenanceModeKey('user-1'));

    expect(shouldShowPlateauAlert(null, plateauWeighIns, 'user-1')).toBe(false);
    expect(shouldShowPlateauAlert(profile, plateauWeighIns.slice(0, 2), 'user-1')).toBe(false);
  });

  it('applyDietBreakTargets', () => {
    const profile = makeProfile({ dailyCalorieTarget: 2000, tdee: 2350, deficitKcal: 350 });
    const updated = applyDietBreakTargets(profile);
    expect(updated.dailyCalorieTarget).toBe(2350);
    expect(updated.deficitKcal).toBe(0);
  });

  it('applySmallReductionTargets female floor at 1200 kcal', () => {
    const profile = makeProfile({
      sex: 'female',
      dailyCalorieTarget: AppConstants.Deficit.minCaloriesFemale,
      tdee: 1700,
      deficitKcal: 200,
    });
    const updated = applySmallReductionTargets(profile);
    expect(updated.dailyCalorieTarget).toBe(AppConstants.Deficit.minCaloriesFemale);
  });

  it('isPlateauSnoozed and isMaintenanceModeActive read stored dates', () => {
    const uid = 'storage-test-user';
    window.localStorage.removeItem(plateauSnoozeKey(uid));
    window.localStorage.removeItem(maintenanceModeKey(uid));

    expect(isPlateauSnoozed(uid)).toBe(false);
    expect(isMaintenanceModeActive(uid)).toBe(false);

    const future = new Date();
    future.setDate(future.getDate() + 1);
    storeDate(plateauSnoozeKey(uid), future);
    expect(isPlateauSnoozed(uid)).toBe(true);

    window.localStorage.removeItem(plateauSnoozeKey(uid));
    window.localStorage.removeItem(maintenanceModeKey(uid));
  });
});
