import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { ageFromDateOfBirth } from '@/lib/nutrition/calculator';

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function validateDateOfBirth(
  date: Date,
  referenceDate: Date = new Date(),
): boolean {
  const age = ageFromDateOfBirth(date, referenceDate);
  return (
    age >= AppConstants.Onboarding.minAgeYears &&
    age <= AppConstants.Onboarding.maxAgeYears
  );
}

export function validateGoalTargetDate(
  date: Date,
  referenceDate: Date = new Date(),
): boolean {
  const start = startOfDay(referenceDate);
  const target = startOfDay(date);
  const minDate = new Date(start);
  minDate.setDate(minDate.getDate() + AppConstants.Onboarding.minGoalDaysFromToday);
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + AppConstants.Onboarding.maxGoalDaysFromToday);
  return target >= minDate && target <= maxDate;
}

export function validationMessageForStep(
  step: 'profileSetup' | 'goalSetup',
): string {
  if (step === 'profileSetup') {
    return copy('onboarding.validation.ageRange', {
      min: AppConstants.Onboarding.minAgeYears,
      max: AppConstants.Onboarding.maxAgeYears,
    });
  }
  return copy('onboarding.validation.goalDateRange', {
    min: AppConstants.Onboarding.minGoalDaysFromToday,
    max: AppConstants.Onboarding.maxGoalDaysFromToday,
  });
}
