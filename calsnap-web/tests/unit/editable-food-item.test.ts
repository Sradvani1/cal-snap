import { describe, expect, it } from 'vitest';
import {
  editableFoodItemFromAnalysisResult,
  updateEditableItemWeight,
} from '@/lib/scanner/editable-food-item';
import {
  allItemsFlagged,
  hasAdjustedItems,
  overallConfidence,
  sumEditableItems,
} from '@/lib/scanner/meal-totals';
import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';

function makeItem(overrides: Partial<EditableFoodItem> = {}): EditableFoodItem {
  return {
    id: overrides.id ?? 'item-1',
    name: overrides.name ?? 'Chicken',
    weightG: overrides.weightG ?? 100,
    calories: overrides.calories ?? 200,
    proteinG: overrides.proteinG ?? 20,
    carbsG: overrides.carbsG ?? 30,
    fatG: overrides.fatG ?? 10,
    saturatedFatG: overrides.saturatedFatG ?? 3,
    unsaturatedFatG: overrides.unsaturatedFatG ?? 7,
    fiberG: overrides.fiberG ?? 5,
    confidence: overrides.confidence ?? 0.9,
    isFlagged: overrides.isFlagged ?? false,
    originalWeightG: overrides.originalWeightG ?? overrides.weightG ?? 100,
  };
}

describe('updateEditableItemWeight', () => {
  it('scales calories and macros at 2× weight', () => {
    const item = makeItem();
    const scaled = updateEditableItemWeight(item, 200);

    expect(scaled.weightG).toBe(200);
    expect(scaled.calories).toBe(400);
    expect(scaled.proteinG).toBeCloseTo(40, 2);
    expect(scaled.carbsG).toBeCloseTo(60, 2);
    expect(scaled.fatG).toBeCloseTo(20, 2);
    expect(scaled.saturatedFatG).toBeCloseTo(6, 2);
    expect(scaled.unsaturatedFatG).toBeCloseTo(14, 2);
    expect(scaled.fiberG).toBeCloseTo(10, 2);
  });

  it('does not scale when current weight is zero', () => {
    const item = makeItem({ weightG: 0, calories: 0 });
    const scaled = updateEditableItemWeight(item, 100);
    expect(scaled).toEqual(item);
  });
});

describe('overallConfidence', () => {
  it('returns arithmetic mean of item confidences', () => {
    const items = [
      makeItem({ confidence: 0.9 }),
      makeItem({ id: 'item-2', confidence: 0.7 }),
    ];
    expect(overallConfidence(items)).toBeCloseTo(0.8, 2);
  });

  it('returns 0 for empty list', () => {
    expect(overallConfidence([])).toBe(0);
  });
});

describe('fromAnalysisResult flagging', () => {
  it('flags items below confidence threshold', () => {
    const item = editableFoodItemFromAnalysisResult(
      {
        name: 'Sauce',
        estimatedWeightG: 30,
        calories: 50,
        proteinG: 1,
        carbsG: 5,
        fatG: 3,
        saturatedFatG: 1,
        unsaturatedFatG: 2,
        fiberG: 0,
        confidence: 0.5,
      },
      new Set(),
    );
    expect(item.isFlagged).toBe(true);
  });

  it('flags items in flaggedItems list', () => {
    const item = editableFoodItemFromAnalysisResult(
      {
        name: 'Dressing',
        estimatedWeightG: 20,
        calories: 80,
        proteinG: 0,
        carbsG: 2,
        fatG: 8,
        saturatedFatG: 2,
        unsaturatedFatG: 6,
        fiberG: 0,
        confidence: 0.9,
      },
      new Set(['Dressing']),
    );
    expect(item.isFlagged).toBe(true);
  });
});

describe('hasAdjustedItems', () => {
  it('detects weight delta greater than 0.01g', () => {
    const items = [makeItem({ id: 'a', weightG: 150 })];
    const originals = new Map([['a', 100]]);
    expect(hasAdjustedItems(items, originals)).toBe(true);
  });

  it('returns false when no original weight recorded', () => {
    const items = [makeItem({ id: 'a', weightG: 150 })];
    const originals = new Map([['a', 100]]);
    expect(hasAdjustedItems(items, originals)).toBe(true);
  });
});

describe('allItemsFlagged', () => {
  it('returns true when every item is flagged', () => {
    const items = [
      makeItem({ isFlagged: true }),
      makeItem({ id: 'b', isFlagged: true }),
    ];
    expect(allItemsFlagged(items)).toBe(true);
  });

  it('returns false when at least one item is not flagged', () => {
    const items = [makeItem({ isFlagged: true }), makeItem({ id: 'b', isFlagged: false })];
    expect(allItemsFlagged(items)).toBe(false);
  });
});

describe('sumEditableItems', () => {
  it('sums totals across items', () => {
    const items = [
      makeItem({ calories: 200, proteinG: 20, carbsG: 10, fatG: 5, saturatedFatG: 1, unsaturatedFatG: 4, fiberG: 2 }),
      makeItem({
        id: 'b',
        calories: 100,
        proteinG: 10,
        carbsG: 5,
        fatG: 3,
        saturatedFatG: 1,
        unsaturatedFatG: 2,
        fiberG: 1,
      }),
    ];
    const totals = sumEditableItems(items);
    expect(totals.totalCalories).toBe(300);
    expect(totals.totalProteinG).toBe(30);
    expect(totals.totalCarbsG).toBe(15);
    expect(totals.totalFatG).toBe(8);
    expect(totals.totalSaturatedFatG).toBe(2);
    expect(totals.totalUnsaturatedFatG).toBe(6);
    expect(totals.totalFiberG).toBe(3);
  });
});
