import { describe, expect, it } from 'vitest';
import { trimmedName } from '@/lib/onboarding/profile-draft';
import { canSaveSettings } from '@/lib/settings/validation';
import { validateWeightKg } from '@/lib/utilities/unit-formatters';
import {
  adjustMacroPercents,
  apply,
  macroPercentsAreValid,
  normalizedMacroPercents,
  preview,
} from '@/lib/services/profile-update-service';
import { createDefaultProfileDraft } from '@/lib/onboarding/profile-draft';
import type { UserProfile } from '@/lib/models/user-profile';

describe('profile-update-service', () => {
  it('macro slider validation', () => {
    expect(adjustMacroPercents('protein', 40, 28, 47, 25)).toEqual([40, 39, 21]);
    expect(adjustMacroPercents('carbs', 50, 28, 47, 25)).toEqual([28, 50, 22]);
    expect(adjustMacroPercents('fat', 40, 28, 47, 25)).toEqual([28, 32, 40]);
    expect(adjustMacroPercents('carbs', 100, 28, 47, 25)).toEqual([28, 72, 0]);

    expect(macroPercentsAreValid(30, 30, 30)).toBe(false);

    const normalized = normalizedMacroPercents(33, 33, 33);
    expect(normalized[0] + normalized[1] + normalized[2]).toBe(100);
    expect(macroPercentsAreValid(...normalized)).toBe(true);
  });

  it('recalculation on profile edit', () => {
    const dateOfBirth = new Date(1991, 5, 14);
    const baseline = preview({
      sex: 'male',
      dateOfBirth,
      heightCm: 175,
      weightKg: 80,
      activityLevel: 'moderatelyActive',
      deficitKcal: 350,
    });

    const taller = preview({
      sex: 'male',
      dateOfBirth,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderatelyActive',
      deficitKcal: 350,
    });
    expect(taller.tdee).toBeGreaterThan(baseline.tdee);
    expect(taller.dailyTarget).toBeGreaterThan(baseline.dailyTarget);

    const lighter = preview({
      sex: 'male',
      dateOfBirth,
      heightCm: 175,
      weightKg: 75,
      activityLevel: 'moderatelyActive',
      deficitKcal: 350,
    });
    expect(lighter.tdee).toBeLessThan(baseline.tdee);
    expect(lighter.dailyTarget).toBeLessThan(baseline.dailyTarget);
    expect(lighter.deficitKcal).toBe(baseline.deficitKcal);
  });

  it('empty display name is valid', () => {
    const draft = createDefaultProfileDraft();
    draft.name = '  ';
    expect(trimmedName(draft)).toBe('');
    expect(
      canSaveSettings(draft, { protein: 28, carbs: 47, fat: 25 }, draft.weightKg, draft.weightKg),
    ).toBe(true);
  });

  it('apply uses requestedDeficit and recomputes goalTargetDate', () => {
    const profile: UserProfile = {
      id: 'user-1',
      name: 'Alex',
      sex: 'male',
      dateOfBirth: new Date(1991, 5, 14),
      heightCm: 178,
      startingWeightKg: 80,
      goalWeightKg: 72,
      goalTargetDate: null,
      activityLevel: 'moderatelyActive',
      dailyCalorieTarget: 2285,
      tdee: 2635,
      deficitKcal: 350,
      macroTargetProteinPct: 0.28,
      macroTargetCarbsPct: 0.47,
      macroTargetFatPct: 0.25,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };
    const draft = createDefaultProfileDraft();
    draft.requestedDeficit = 400;

    apply(profile, draft, 78);

    expect(profile.deficitKcal).toBe(400);
    expect(profile.goalTargetDate).not.toBeNull();
    expect(profile.dailyCalorieTarget).toBeLessThan(profile.tdee);
  });

  it('rejects invalid weight values', () => {
    expect(validateWeightKg(Number.NaN)).toBe(false);
    expect(validateWeightKg(0)).toBe(false);
    const draft = createDefaultProfileDraft();
    expect(
      canSaveSettings(draft, { protein: 28, carbs: 47, fat: 25 }, Number.NaN, 80),
    ).toBe(false);
  });
});
