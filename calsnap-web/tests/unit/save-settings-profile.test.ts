import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import { createDefaultProfileDraft } from '@/lib/onboarding/profile-draft';
import { defaultReminderPrefs } from '@/lib/progress/reminder-prefs';

const mockSaveProfile = vi.fn();

vi.mock('@/lib/repositories/profile', () => ({
  saveProfile: (...args: unknown[]) => mockSaveProfile(...args),
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

function makeExtras(overrides: Partial<ProfileExtras> = {}): ProfileExtras {
  return {
    onboardingCompleted: true,
    currentWeightKg: 78,
    useLbsForWeight: false,
    useImperialForHeight: false,
    ...defaultReminderPrefs(),
    ...overrides,
  };
}

describe('save-settings-profile', () => {
  beforeEach(() => {
    mockSaveProfile.mockReset();
    mockSaveProfile.mockResolvedValue(undefined);
  });

  it('calls saveProfile and writes startingWeightKg to the profile', async () => {
    const profile = makeProfile({ startingWeightKg: 80 });
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
      startingWeightKg: 82,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    expect(mockSaveProfile).toHaveBeenCalledOnce();
    const savedProfile = mockSaveProfile.mock.calls[0][1] as UserProfile;
    expect(savedProfile.startingWeightKg).toBe(82);
  });

  it('preserves extras.currentWeightKg unchanged', async () => {
    const profile = makeProfile();
    const extras = makeExtras({ currentWeightKg: 78 });
    const draft = createDefaultProfileDraft();

    await saveSettingsProfile({
      uid: 'user-1',
      profile,
      extras,
      draft,
      macroProteinPct: 28,
      macroCarbsPct: 47,
      macroFatPct: 25,
      startingWeightKg: 80,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    const savedExtras = mockSaveProfile.mock.calls[0][2] as ProfileExtras;
    expect(savedExtras.currentWeightKg).toBe(78);
  });

  it('normalizes startingWeightKg via unitPrefs', async () => {
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
      startingWeightKg: 7.7,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    const savedProfile = mockSaveProfile.mock.calls[0][1] as UserProfile;
    expect(savedProfile.startingWeightKg).toBe(35);
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
      startingWeightKg: 80,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    expect(result.savedDraft.heightCm).toBe(120);
    expect(result.savedStartingWeightKg).toBe(80);
  });

  it('recomputes goalTargetDate when deficit changes', async () => {
    const profile = makeProfile({
      goalTargetDate: new Date(2026, 11, 27),
      deficitKcal: 350,
    });
    const extras = makeExtras();
    const draft = createDefaultProfileDraft();
    draft.requestedDeficit = 400;

    await saveSettingsProfile({
      uid: 'user-1',
      profile,
      extras,
      draft,
      macroProteinPct: 28,
      macroCarbsPct: 47,
      macroFatPct: 25,
      startingWeightKg: 80,
      reminderPrefs: defaultReminderPrefs(),
      unitPrefs: { useLbsForWeight: false, useImperialForHeight: false },
    });

    expect(mockSaveProfile).toHaveBeenCalledOnce();
    const savedProfile = mockSaveProfile.mock.calls[0][1] as UserProfile;
    expect(savedProfile.deficitKcal).toBe(400);
    expect(savedProfile.goalTargetDate).not.toBeNull();
    expect(savedProfile.goalTargetDate?.getTime()).not.toBe(
      profile.goalTargetDate?.getTime(),
    );
  });
});
