import { describe, expect, it } from 'vitest';
import { AppConstants } from '@/lib/constants';
import {
  dateFromLocalDateInput,
  dateOfBirthInputBounds,
  goalTargetDateInputBounds,
  isCompleteDateInputValue,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';

describe('date-input', () => {
  it('round-trips local calendar date', () => {
    const date = new Date(1991, 5, 14, 15, 30, 0);
    const inputValue = toLocalDateInputValue(date);
    expect(inputValue).toBe('1991-06-14');
    expect(dateFromLocalDateInput(inputValue).getFullYear()).toBe(1991);
    expect(dateFromLocalDateInput(inputValue).getMonth()).toBe(5);
    expect(dateFromLocalDateInput(inputValue).getDate()).toBe(14);
  });

  it('detects complete date input values', () => {
    expect(isCompleteDateInputValue('1991-06-14')).toBe(true);
    expect(isCompleteDateInputValue('1991-06-1')).toBe(false);
    expect(isCompleteDateInputValue('1991-06')).toBe(false);
    expect(isCompleteDateInputValue('')).toBe(false);
  });

  it('returns date-of-birth input bounds for 16–90 years', () => {
    const referenceDate = new Date(2026, 5, 28, 12, 0, 0);
    const { min, max } = dateOfBirthInputBounds(referenceDate);

    expect(max).toBe(
      toLocalDateInputValue(
        new Date(
          referenceDate.getFullYear() - AppConstants.Onboarding.minAgeYears,
          referenceDate.getMonth(),
          referenceDate.getDate(),
        ),
      ),
    );
    expect(min).toBe(
      toLocalDateInputValue(
        new Date(
          referenceDate.getFullYear() - AppConstants.Onboarding.maxAgeYears,
          referenceDate.getMonth(),
          referenceDate.getDate(),
        ),
      ),
    );
  });

  it('returns goal target date input bounds for 14–730 days', () => {
    const referenceDate = new Date(2026, 5, 28, 12, 0, 0);
    const { min, max } = goalTargetDateInputBounds(referenceDate);

    expect(min).toBe(
      toLocalDateInputValue(
        new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate() + AppConstants.Onboarding.minGoalDaysFromToday,
        ),
      ),
    );
    expect(max).toBe(
      toLocalDateInputValue(
        new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate() + AppConstants.Onboarding.maxGoalDaysFromToday,
        ),
      ),
    );
  });
});
