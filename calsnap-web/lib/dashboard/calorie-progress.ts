export type CalorieProgressBand = 'under' | 'onTrack' | 'over';
export type FiberProgressBand = 'low' | 'moderate' | 'onTrack';

export function isCalorieIntakeOnTarget(calories: number, target: number): boolean {
  if (target <= 0) {
    return false;
  }
  return calorieProgressBand(calories / target) === 'onTrack';
}

export function calorieProgressBand(ratio: number): CalorieProgressBand {
  if (ratio < 0.9) {
    return 'under';
  }
  if (ratio < 1.1) {
    return 'onTrack';
  }
  return 'over';
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
