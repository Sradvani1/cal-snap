import { describe, expect, it } from 'vitest';
import { AppConstants } from '@/lib/constants';
import {
  mealPhotoRetrySteps,
  scaledDimensions,
  selectFirstUnderByteCap,
} from '@/lib/services/meal-photo-processor';

describe('mealPhotoRetrySteps', () => {
  it('orders long edge before quality descending', () => {
    const steps = mealPhotoRetrySteps();
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toEqual({
      maxLongEdge: AppConstants.MealPhoto.longEdgeRetrySteps[0],
      quality: AppConstants.MealPhoto.qualityRetrySteps[0],
    });
    expect(steps.at(-1)).toEqual({
      maxLongEdge: AppConstants.MealPhoto.minLongEdgePx,
      quality: AppConstants.MealPhoto.minJPEGQuality,
    });
  });

  it('excludes steps below min thresholds', () => {
    const steps = mealPhotoRetrySteps();
    for (const step of steps) {
      expect(step.maxLongEdge).toBeGreaterThanOrEqual(AppConstants.MealPhoto.minLongEdgePx);
      expect(step.quality).toBeGreaterThanOrEqual(AppConstants.MealPhoto.minJPEGQuality);
    }
  });
});

describe('scaledDimensions', () => {
  it('does not upscale small images', () => {
    expect(scaledDimensions(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it('scales landscape image to max long edge', () => {
    const result = scaledDimensions(2560, 1440, 1280);
    expect(result.width).toBe(1280);
    expect(result.height).toBe(720);
  });

  it('scales portrait image to max long edge', () => {
    const result = scaledDimensions(1080, 1920, 1280);
    expect(result.width).toBe(720);
    expect(result.height).toBe(1280);
  });
});

describe('selectFirstUnderByteCap', () => {
  it('returns first candidate under hard max bytes', () => {
    const selected = selectFirstUnderByteCap([
      { maxLongEdge: 1280, quality: 0.72, byteCount: 1_200_000 },
      { maxLongEdge: 1152, quality: 0.72, byteCount: 900_000 },
      { maxLongEdge: 1024, quality: 0.65, byteCount: 700_000 },
    ]);
    expect(selected?.byteCount).toBe(900_000);
  });

  it('returns null when all candidates exceed cap', () => {
    const selected = selectFirstUnderByteCap([
      { maxLongEdge: 1280, quality: 0.72, byteCount: 1_200_000 },
    ]);
    expect(selected).toBeNull();
  });
});
