import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import { mealEntryToDoc } from '@/lib/models/meal-entry-doc';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { FoodItem } from '@/lib/models/food-item';
import { updateEditableItemWeight } from '@/lib/scanner/editable-food-item';
import {
  assertScannerEditMode,
  MealScannerNotInEditModeError,
} from '@/lib/scanner/edit-baseline';

function makeMeal(
  overrides: Partial<MealEntry> & Pick<MealEntry, 'mealType' | 'totalCalories'>,
): MealEntry {
  return {
    id: overrides.id ?? 'meal-1',
    userId: overrides.userId ?? 'user-1',
    timestamp: overrides.timestamp ?? new Date('2026-06-27T12:00:00'),
    mealType: overrides.mealType,
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
    ...overrides,
  };
}

function makeFoodItem(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: overrides.id ?? 'item-1',
    name: overrides.name ?? 'Chicken',
    estimatedWeightG: overrides.estimatedWeightG ?? 100,
    calories: overrides.calories ?? 400,
    proteinG: overrides.proteinG ?? 30,
    carbsG: overrides.carbsG ?? 10,
    fatG: overrides.fatG ?? 8,
    saturatedFatG: overrides.saturatedFatG ?? 2,
    unsaturatedFatG: overrides.unsaturatedFatG ?? 6,
    fiberG: overrides.fiberG ?? 2,
    confidence: overrides.confidence ?? 0.9,
    isFlagged: overrides.isFlagged ?? false,
  };
}

describe('meal log CRUD', () => {
  it('testMealDeletion decreases aggregate totals', () => {
    const breakfast = makeMeal({
      id: 'breakfast',
      mealType: 'breakfast',
      totalCalories: 800,
      totalFiberG: 5,
      totalProteinG: 40,
    });
    const lunch = makeMeal({
      id: 'lunch',
      mealType: 'lunch',
      totalCalories: 700,
      totalFiberG: 4,
      totalProteinG: 35,
    });

    const before = aggregateTodaysMeals([breakfast, lunch]);
    expect(before.todaysCalories).toBe(1500);
    expect(before.todaysFiberG).toBe(9);

    const after = aggregateTodaysMeals([lunch]);
    expect(after.todaysCalories).toBe(700);
    expect(after.todaysProteinG).toBe(35);
    expect(after.todaysFiberG).toBe(4);
  });

  it('testMealEdit doubles item weight and preserves id/timestamp in update mapper', () => {
    const item = makeFoodItem();
    const meal = makeMeal({
      id: 'meal-edit',
      mealType: 'lunch',
      totalCalories: 400,
      totalProteinG: 30,
      totalCarbsG: 10,
      totalFatG: 8,
      totalFiberG: 2,
      items: [item],
    });

    const editable = {
      id: item.id,
      name: item.name,
      weightG: item.estimatedWeightG,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      saturatedFatG: item.saturatedFatG,
      unsaturatedFatG: item.unsaturatedFatG,
      fiberG: item.fiberG,
      confidence: item.confidence,
      isFlagged: item.isFlagged,
      originalWeightG: item.estimatedWeightG,
    };
    const doubled = updateEditableItemWeight(editable, 200);

    const updatedEntry: MealEntry = {
      ...meal,
      totalCalories: doubled.calories,
      totalProteinG: doubled.proteinG,
      totalCarbsG: doubled.carbsG,
      totalFatG: doubled.fatG,
      totalSaturatedFatG: doubled.saturatedFatG,
      totalUnsaturatedFatG: doubled.unsaturatedFatG,
      totalFiberG: doubled.fiberG,
      items: [
        {
          ...item,
          estimatedWeightG: doubled.weightG,
          calories: doubled.calories,
          proteinG: doubled.proteinG,
          carbsG: doubled.carbsG,
          fatG: doubled.fatG,
          saturatedFatG: doubled.saturatedFatG,
          unsaturatedFatG: doubled.unsaturatedFatG,
          fiberG: doubled.fiberG,
        },
      ],
    };

    const createdAt = Timestamp.fromDate(new Date('2026-06-01T10:00:00'));
    const doc = mealEntryToDoc(updatedEntry, createdAt);

    expect(updatedEntry.id).toBe('meal-edit');
    expect(updatedEntry.timestamp).toEqual(meal.timestamp);
    expect(updatedEntry.totalCalories).toBe(800);
    expect(doc.createdAt).toEqual(createdAt);
    expect(doc.updatedAt.toMillis()).toBeGreaterThanOrEqual(createdAt.toMillis());
    expect(doc.timestamp.toDate()).toEqual(meal.timestamp);
  });

  it('testMealEntryToUpdateDocPreservesCreatedAt', () => {
    const meal = makeMeal({ mealType: 'dinner', totalCalories: 500 });
    const createdAt = Timestamp.fromDate(new Date('2026-05-01T08:00:00'));
    const doc = mealEntryToDoc(meal, createdAt);

    expect(doc.createdAt).toEqual(createdAt);
    expect(doc.updatedAt.toMillis()).toBeGreaterThanOrEqual(createdAt.toMillis());
  });

  it('testUpdateMealRequiresEditMode', () => {
    expect(() => assertScannerEditMode(false)).toThrow(MealScannerNotInEditModeError);
    expect(() => assertScannerEditMode(true)).not.toThrow();
  });
});
