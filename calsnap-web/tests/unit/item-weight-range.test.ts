import { describe, expect, it } from 'vitest';
import {
  extendItemWeightRange,
  initialItemWeightRange,
} from '@/lib/nutrition/item-weight-range';

describe('item weight ranges', () => {
  it('starts each item at 50 to 150 percent of its original weight', () => {
    expect(initialItemWeightRange(200)).toEqual({ min: 100, max: 300 });
  });

  it('keeps at least a one-gram range for tiny items', () => {
    expect(initialItemWeightRange(1)).toEqual({ min: 1, max: 2 });
  });

  it('shifts the range upward by half the original weight', () => {
    expect(extendItemWeightRange({ min: 100, max: 300 }, 200, 'higher')).toEqual({
      min: 200,
      max: 400,
    });
  });

  it('shifts the range downward without allowing zero grams', () => {
    expect(extendItemWeightRange({ min: 100, max: 300 }, 200, 'lower')).toEqual({
      min: 1,
      max: 201,
    });
  });

  it('stops extending at the 2,000 gram item cap', () => {
    const range = { min: 1_900, max: 2_000 };
    expect(extendItemWeightRange(range, 200, 'higher')).toBe(range);
  });

  it('shortens the final shift to land exactly on the item cap', () => {
    expect(extendItemWeightRange({ min: 1_750, max: 1_950 }, 200, 'higher')).toEqual({
      min: 1_800,
      max: 2_000,
    });
  });
});
