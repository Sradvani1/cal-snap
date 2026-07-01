import { describe, expect, it } from 'vitest';
import { AppConstants } from '@/lib/constants';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import {
  ageFromDateOfBirth,
  bmr,
  dailyTarget,
  tdee,
} from '@/lib/nutrition/calculator';
import {
  makeProfileFromDraft,
  profileToDoc,
} from '@/lib/repositories/profile';
import { defaultReminderPrefs } from '@/lib/progress/reminder-prefs';

function fixedDraft(): ProfileDraft {
  return {
    name: 'Test User',
    sex: 'male',
    dateOfBirth: new Date(1991, 5, 14),
    heightCm: 178,
    weightKg: 80,
    goalWeightKg: 72,
    goalTargetDate: new Date(2026, 11, 27),
    activityLevel: 'moderatelyActive',
    requestedDeficit: 350,
    useImperialHeight: false,
    useLbsWeight: true,
    useLbsGoalWeight: true,
  };
}

describe('profile repository', () => {
  it('makeProfileFromDraft applies macro defaults', () => {
    const profile = makeProfileFromDraft(fixedDraft(), 'user-1');

    expect(profile.macroTargetProteinPct).toBe(
      AppConstants.Nutrition.defaultMacroProteinPct,
    );
    expect(profile.macroTargetCarbsPct).toBe(
      AppConstants.Nutrition.defaultMacroCarbsPct,
    );
    expect(profile.macroTargetFatPct).toBe(
      AppConstants.Nutrition.defaultMacroFatPct,
    );
  });

  it('makeProfileFromDraft produces positive TDEE and target', () => {
    const profile = makeProfileFromDraft(fixedDraft(), 'user-1');

    expect(profile.tdee).toBeGreaterThan(0);
    expect(profile.dailyCalorieTarget).toBeGreaterThan(0);
  });

  it('makeProfileFromDraft matches calculator for fixed draft', () => {
    const draft = fixedDraft();
    const profile = makeProfileFromDraft(draft, 'user-1');

    const age = ageFromDateOfBirth(draft.dateOfBirth);
    const bmrValue = bmr(draft.weightKg, draft.heightCm, age, draft.sex);
    const tdeeValue = tdee(bmrValue, draft.activityLevel);
    const targetResult = dailyTarget(tdeeValue, draft.requestedDeficit, draft.sex);

    expect(profile.tdee).toBe(Math.round(tdeeValue));
    expect(profile.dailyCalorieTarget).toBe(targetResult.target);
    expect(profile.deficitKcal).toBe(targetResult.deficit);
  });

  it('profileToDoc preserves useImperialForHeight and heightCm from draft', () => {
    const draft = { ...fixedDraft(), useImperialHeight: true, heightCm: 175 };
    const profile = makeProfileFromDraft(draft, 'user-1');

    expect(profile.heightCm).toBe(175);

    const doc = profileToDoc(profile, {
      onboardingCompleted: true,
      currentWeightKg: draft.weightKg,
      useLbsForWeight: draft.useLbsWeight,
      useImperialForHeight: draft.useImperialHeight,
      ...defaultReminderPrefs(),
    });

    expect(doc.useImperialForHeight).toBe(true);
    expect(doc.heightCm).toBe(175);
  });
});
