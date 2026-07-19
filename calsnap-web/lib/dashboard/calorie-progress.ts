import { fiberTargetG } from '@/lib/nutrition/calculator';

export type CalorieProgressBand = 'under' | 'onTrack' | 'over';
export type FiberProgressBand = 'low' | 'moderate' | 'onTrack';

export function calorieProgressBand(ratio: number): CalorieProgressBand {
  if (ratio < 0.9) {
    return 'under';
  }
  if (ratio < 1.1) {
    return 'onTrack';
  }
  return 'over';
}

export function isCalorieIntakeOnTarget(calories: number, target: number): boolean {
  if (target <= 0) {
    return false;
  }
  return calorieProgressBand(calories / target) === 'onTrack';
}

export function fiberProgressBand(ratio: number): FiberProgressBand {
  if (ratio >= 0.9) {
    return 'onTrack';
  }
  if (ratio >= 0.7) {
    return 'moderate';
  }
  return 'low';
}

export function calorieProgress(consumed: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return consumed / target;
}

export function remainingCalories(consumed: number, target: number): number {
  return target - consumed;
}

export function fiberTargetForDailyCalories(dailyCalorieTarget: number): number {
  return fiberTargetG(dailyCalorieTarget);
}

export function fiberProgressRatio(consumedFiberG: number, dailyCalorieTarget: number): number {
  const target = fiberTargetForDailyCalories(dailyCalorieTarget);
  if (target <= 0) {
    return 0;
  }
  return consumedFiberG / target;
}


