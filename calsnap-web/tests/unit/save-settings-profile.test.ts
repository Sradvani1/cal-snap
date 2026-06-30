import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import { createDefaultProfileDraft } from '@/lib/onboarding/profile-draft';
import { defaultReminderPrefs } from '@/lib/progress/reminder-prefs';

const mockSaveProfile = vi.fn();
const mockSaveWeighIn = vi.fn();

vi.mock('@/lib/repositories/profile', () => ({
  saveProfile: (...args: unknown[]) => mockSaveProfile(...args),
}));

vi.mock('@/lib/services/weigh-in-service', () => ({
  saveWeighIn: (...args: unknown[]) => mockSaveWeighIn(...args),
}));

import { saveSettingsProfile } from '@/lib/services/save-settings-profile';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    name: 'Alex',
    sex: 'male',
    dateOfBirth: new Date(1991, 5, 14),
    heightCm: 178,
    startingWeightKg: 80,
    goalWeightKg: 72,
    goalTargetDate: new Date(2026, 11, 27),
    activityLevel: 'moderatelyActive',
    dailyCalorieTarget: 2285,
    tdee: 2635,
    deficitKcal: 350,
    macroTargetProteinPct: 0.28,
    macroTargetCarbsPct: 0.47,
    macroTargetFatPct: 0.25,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeExtras(): ProfileExtras {
  return {
    onboardingCompleted: true,
    currentWeightKg: 80,
    useLbsForWeight: false,
    useImperialForHeight: false,
    ...defaultReminderPrefs(),
  };
}

describe('save-settings-profile', () => {
  beforeEach(() => {
    mockSaveProfile.mockReset();
    mockSaveWeighIn.mockReset();
    mockSaveProfile.mockResolvedValue(undefined);
    mockSaveWeighIn.mockResolvedValue({
      updatedProfile: makeProfile(),
      didTriggerPlateau: false,
    });
  });

  it('calls saveProfile when weight unchanged', async () => {
    const profile = makeProfile();
    const extras = makeExtras();
    const draft = createDefaultProfileDraft();
    draft.weightKg = 80;

    await saveSettingsProfile({
      uid: 'user-1',
      profile,
      extras,
      draft,
      macroProteinPct: 28,
      macroCarbsPct: 47,
      macroFatPct: 25,
      currentWeightKg: 80,
      savedWeightKg: 80,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    expect(mockSaveProfile).toHaveBeenCalledOnce();
    expect(mockSaveWeighIn).not.toHaveBeenCalled();
  });

  it('returns normalized values in the save result', async () => {
    const profile = makeProfile();
    const extras = makeExtras();
    const draft = createDefaultProfileDraft();
    draft.heightCm = 18;

    const result = await saveSettingsProfile({
      uid: 'user-1',
      profile,
      extras,
      draft,
      macroProteinPct: 28,
      macroCarbsPct: 47,
      macroFatPct: 25,
      currentWeightKg: 80,
      savedWeightKg: 80,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    expect(result.savedDraft.heightCm).toBe(120);
    expect(result.savedCurrentWeightKg).toBe(80);
  });

  it('calls saveWeighIn when weight delta is at least 0.05 kg', async () => {
    const profile = makeProfile();
    const extras = makeExtras();
    const draft = createDefaultProfileDraft();
    draft.weightKg = 79;

    await saveSettingsProfile({
      uid: 'user-1',
      profile,
      extras,
      draft,
      macroProteinPct: 28,
      macroCarbsPct: 47,
      macroFatPct: 25,
      currentWeightKg: 79,
      savedWeightKg: 80,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    expect(mockSaveWeighIn).toHaveBeenCalledOnce();
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('persists normalized current weight, not the raw in-progress value', async () => {
    const profile = makeProfile();
    const extras = makeExtras();
    const draft = createDefaultProfileDraft();

    await saveSettingsProfile({
      uid: 'user-1',
      profile,
      extras,
      draft,
      macroProteinPct: 28,
      macroCarbsPct: 47,
      macroFatPct: 25,
      currentWeightKg: 7.7,
      savedWeightKg: 80,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    expect(mockSaveWeighIn).toHaveBeenCalledOnce();
    const weighInInput = mockSaveWeighIn.mock.calls[0][0];
    expect(weighInInput.newWeightKg).toBe(35);
    expect(weighInInput.profileExtras.currentWeightKg).toBe(35);
  });
});
