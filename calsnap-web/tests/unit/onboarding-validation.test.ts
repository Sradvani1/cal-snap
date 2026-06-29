import { describe, expect, it } from 'vitest';
import { createDefaultProfileDraft } from '@/lib/onboarding/profile-draft';
import {
  validateDateOfBirth,
  validateGoalTargetDate,
} from '@/lib/onboarding/validation';

describe('onboarding validation', () => {
  const referenceDate = new Date(2026, 5, 27);

  it('rejects age 10', () => {
    const dob = new Date(2016, 5, 27);
    expect(validateDateOfBirth(dob, referenceDate)).toBe(false);
  });

  it('rejects age 15', () => {
    const dob = new Date(2011, 5, 27);
    expect(validateDateOfBirth(dob, referenceDate)).toBe(false);
  });

  it('accepts age 16', () => {
    const dob = new Date(2010, 5, 27);
    expect(validateDateOfBirth(dob, referenceDate)).toBe(true);
  });

  it('accepts age 35', () => {
    const dob = new Date(1991, 5, 27);
    expect(validateDateOfBirth(dob, referenceDate)).toBe(true);
  });

  it('rejects goal date 7 days out', () => {
    const goalDate = new Date(2026, 6, 4);
    expect(validateGoalTargetDate(goalDate, referenceDate)).toBe(false);
  });

  it('accepts goal date 14 days out', () => {
    const goalDate = new Date(2026, 6, 11);
    expect(validateGoalTargetDate(goalDate, referenceDate)).toBe(true);
  });

  it('does not require name to advance profile step', () => {
    const draft = createDefaultProfileDraft();
    draft.name = '';
    expect(validateDateOfBirth(draft.dateOfBirth, referenceDate)).toBe(true);
  });
});
