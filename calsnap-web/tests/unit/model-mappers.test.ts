import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { FoodItem } from '@/lib/models/food-item';
import type { MealEntry } from '@/lib/models/meal-entry';
import {
  mealDocToEntry,
  mealEntryToDoc,
} from '@/lib/models/meal-entry-doc';
import type { WeighIn } from '@/lib/models/weigh-in';
import {
  weighInDocToEntry,
  weighInToDoc,
} from '@/lib/models/weigh-in-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import { docToProfile, profileToDoc } from '@/lib/repositories/profile';

const fixedTimestamp = Timestamp.fromDate(new Date('2026-06-27T12:00:00Z'));
const fixedDate = fixedTimestamp.toDate();

function makeFoodItem(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: overrides.id ?? 'item-1',
    name: overrides.name ?? 'Grilled chicken',
    estimatedWeightG: overrides.estimatedWeightG ?? 150,
    calories: overrides.calories ?? 248,
    proteinG: overrides.proteinG ?? 46,
    carbsG: overrides.carbsG ?? 0,
    fatG: overrides.fatG ?? 5,
    fiberG: overrides.fiberG ?? 0,
    confidence: overrides.confidence ?? 0.92,
    isFlagged: overrides.isFlagged ?? false,
    ...overrides,
  };
}

function makeMealEntry(): MealEntry {
  return {
    id: 'meal-1',
    userId: 'user-1',
    timestamp: fixedDate,
    mealType: 'lunch',
    photoStoragePath: 'users/user-1/meals/meal-1/photo.jpg',
    textDescription: 'Lunch plate',
    totalCalories: 382,
    totalProteinG: 49,
    totalCarbsG: 28,
    totalFatG: 6,
    totalFiberG: 2,
    geminiConfidence: 0.9,
    isManuallyAdjusted: false,
    estimationNotes: 'Round-trip test',
    items: [makeFoodItem()],
  };
}

function makeWeighIn(): WeighIn {
  return {
    id: 'weigh-in-1',
    userId: 'user-1',
    date: fixedDate,
    weightKg: 79.5,
    calculatedTDEE: 2400,
    adjustedDailyTarget: 2050,
    bmi: 25.1,
    source: 'manual',
    createdAt: fixedDate,
  };
}

function makeProfile(): UserProfile {
  return {
    id: 'user-1',
    name: 'Test User',
    sex: 'male',
    dateOfBirth: new Date('1991-06-14T00:00:00Z'),
    heightCm: 178,
    startingWeightKg: 80,
    goalWeightKg: 72,
    goalTargetDate: new Date('2026-12-27T00:00:00Z'),
    activityLevel: 'moderatelyActive',
    dailyCalorieTarget: 2050,
    tdee: 2400,
    deficitKcal: 350,
    macroTargetProteinPct: 0.28,
    macroTargetCarbsPct: 0.47,
    macroTargetFatPct: 0.25,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };
}

function makeProfileExtras(): ProfileExtras {
  return {
    onboardingCompleted: true,
    currentWeightKg: 79.5,
    useLbsForWeight: true,
    useImperialForHeight: false,
    weighInReminderEnabled: true,
    weighInReminderWeekday: 0,
    weighInReminderHour: 8,
    weighInReminderMinute: 0,
  };
}

describe('model mappers', () => {
  it('MealEntry round-trip via mealEntryToDoc and mealDocToEntry', () => {
    const original = makeMealEntry();
    const doc = mealEntryToDoc(original);
    const restored = mealDocToEntry(original.id, {
      ...doc,
      createdAt: fixedTimestamp,
      updatedAt: fixedTimestamp,
    });

    expect(restored).toEqual(original);
  });

  it('WeighIn round-trip via weighInToDoc and weighInDocToEntry', () => {
    const original = makeWeighIn();
    const doc = weighInToDoc(original);
    const restored = weighInDocToEntry(original.id, {
      ...doc,
      createdAt: fixedTimestamp,
    });

    expect(restored).toEqual(original);
  });

  it('UserProfile round-trip via profileToDoc and docToProfile', () => {
    const original = makeProfile();
    const extras = makeProfileExtras();
    const doc = profileToDoc(original, extras);
    const restored = docToProfile(doc, original.id);

    expect(restored).toEqual(original);
  });

  it('UserProfile round-trip preserves null goalTargetDate', () => {
    const original = { ...makeProfile(), goalTargetDate: null };
    const extras = makeProfileExtras();
    const doc = profileToDoc(original, extras);
    const restored = docToProfile(doc, original.id);

    expect(restored.goalTargetDate).toBeNull();
    expect(restored).toEqual(original);
  });
});
