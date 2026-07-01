import { copy } from '@/lib/copy';
import type { ActivityLevel } from '@/lib/models/activity-level';
import type { BiologicalSex } from '@/lib/models/biological-sex';
import { ageFromDateOfBirth, projectedGoalDate } from '@/lib/nutrition/calculator';

export function validateGoalBelowCurrent(
  goalWeightKg: number,
  currentWeightKg: number,
): boolean {
  return goalWeightKg < currentWeightKg;
}

export function computeGoalTargetDate(input: {
  currentWeightKg: number;
  goalWeightKg: number;
  heightCm: number;
  dateOfBirth: Date;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  deficitKcal: number;
  referenceDate?: Date;
}): Date | null {
  const referenceDate = input.referenceDate ?? new Date();
  const ageYears = ageFromDateOfBirth(input.dateOfBirth, referenceDate);

  return projectedGoalDate(
    input.currentWeightKg,
    input.goalWeightKg,
    input.heightCm,
    ageYears,
    input.sex,
    input.activityLevel,
    input.deficitKcal,
    referenceDate,
  );
}

export function formatEstimatedGoalDate(
  goalTargetDate: Date | null,
  deficitKcal: number,
): string {
  if (goalTargetDate) {
    return goalTargetDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (deficitKcal === 0) {
    return copy('progress.stats.maintaining');
  }
  return copy('common.unavailable');
}
