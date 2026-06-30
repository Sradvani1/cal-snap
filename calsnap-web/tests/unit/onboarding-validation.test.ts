import { describe, expect, it } from 'vitest';
import { createDefaultProfileDraft } from '@/lib/onboarding/profile-draft';
import {
  canAdvanceGoalSetup,
  canAdvanceProfileSetup,
  normalizeGoalSetupDraft,
  normalizeProfileSetupDraft,
  validateDateOfBirth,
  validateGoalTargetDate,
  validationMessageForStep,
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
    expect(canAdvanceProfileSetup(draft)).toBe(true);
  });

  it('rejects out-of-range height before normalization', () => {
    const draft = createDefaultProfileDraft();
    draft.heightCm = 50;
    expect(canAdvanceProfileSetup(draft)).toBe(false);
    expect(validationMessageForStep('profileSetup', draft)).toContain('Height');
  });

  it('prioritizes age validation message over height when both fail', () => {
    const draft = createDefaultProfileDraft();
    draft.dateOfBirth = new Date(2020, 0, 1);
    draft.heightCm = 50;
    expect(validationMessageForStep('profileSetup', draft)).toContain('Age');
  });

  it('rejects out-of-range weight before normalization', () => {
    const draft = createDefaultProfileDraft();
    draft.weightKg = 10;
    expect(canAdvanceProfileSetup(draft)).toBe(false);
    expect(validationMessageForStep('profileSetup', draft)).toContain('Weight');
  });

  it('normalizes partial height and weight entries on profile step', () => {
    const draft = createDefaultProfileDraft();
    draft.heightCm = 18;
    draft.weightKg = 7.7;
    const normalized = normalizeProfileSetupDraft(draft);
    expect(canAdvanceProfileSetup(normalized)).toBe(true);
    expect(normalized.heightCm).toBe(120);
    // Default draft uses lbs; 7.7 kg ≈ 17 lbs snaps to the 80 lbs minimum.
    expect(normalized.weightKg).toBeCloseTo(36.29, 1);
  });

  it('normalizes goal weight on goal step', () => {
    const draft = createDefaultProfileDraft();
    draft.goalWeightKg = 7.7;
    const normalized = normalizeGoalSetupDraft(draft);
    expect(canAdvanceGoalSetup(normalized)).toBe(true);
    expect(normalized.goalWeightKg).toBeCloseTo(36.29, 1);
  });
});
