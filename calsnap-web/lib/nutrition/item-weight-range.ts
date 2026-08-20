import { AppConstants } from '@/lib/constants';

export interface ItemWeightRange {
  min: number;
  max: number;
}

const MIN_WEIGHT_G = 1;
const INITIAL_MIN_FACTOR = 0.5;
const INITIAL_MAX_FACTOR = 1.5;

function clampedWeight(value: number): number {
  return Math.min(
    AppConstants.Nutrition.plausibleItemMax.estimatedWeightG,
    Math.max(MIN_WEIGHT_G, Math.round(value)),
  );
}

export function initialItemWeightRange(originalWeightG: number): ItemWeightRange {
  const max = Math.max(
    MIN_WEIGHT_G + 1,
    clampedWeight(originalWeightG * INITIAL_MAX_FACTOR),
  );
  const min = Math.min(
    clampedWeight(originalWeightG * INITIAL_MIN_FACTOR),
    max - 1,
  );

  return { min, max };
}

export function extendItemWeightRange(
  range: ItemWeightRange,
  originalWeightG: number,
  direction: 'lower' | 'higher',
): ItemWeightRange {
  const shift = Math.max(1, Math.round(originalWeightG * INITIAL_MIN_FACTOR));
  const cap = AppConstants.Nutrition.plausibleItemMax.estimatedWeightG;

  if (direction === 'higher') {
    const delta = Math.min(shift, cap - range.max);
    return delta > 0 ? { min: range.min + delta, max: range.max + delta } : range;
  }

  const delta = Math.min(shift, range.min - MIN_WEIGHT_G);
  return delta > 0 ? { min: range.min - delta, max: range.max - delta } : range;
}
