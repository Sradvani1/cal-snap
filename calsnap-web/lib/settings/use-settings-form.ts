'use client';

import { useCallback, useMemo, useState } from 'react';
import { AppConstants } from '@/lib/constants';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { profileDraftFromProfile } from '@/lib/settings/profile-draft-from-profile';
import {
  canSaveSettings,
  settingsValidationMessage,
} from '@/lib/settings/validation';
import {
  adjustMacroPercents,
  normalizedMacroPercents,
  preview,
  type MacroKind,
} from '@/lib/services/profile-update-service';
import { computeGoalTargetDate } from '@/lib/nutrition/goal-pathway';
import {
  defaultReminderPrefs,
  type ResolvedReminderPrefs,
} from '@/lib/progress/reminder-prefs';

interface SettingsSnapshot {
  draft: ProfileDraft;
  macroProteinPct: number;
  macroCarbsPct: number;
  macroFatPct: number;
  startingWeightKg: number;
  useLbsForWeight: boolean;
  useImperialForHeight: boolean;
  reminderPrefs: ResolvedReminderPrefs;
}

function macroIntsFromProfile(profile: UserProfile): [number, number, number] {
  const raw: [number, number, number] = [
    Math.round(profile.macroTargetProteinPct * 100),
    Math.round(profile.macroTargetCarbsPct * 100),
    Math.round(profile.macroTargetFatPct * 100),
  ];
  return normalizedMacroPercents(...raw);
}

function reminderPrefsFromExtras(extras: ProfileExtras): ResolvedReminderPrefs {
  const defaults = defaultReminderPrefs();
  return {
    weighInReminderEnabled: extras.weighInReminderEnabled ?? defaults.weighInReminderEnabled,
    weighInReminderWeekday: extras.weighInReminderWeekday ?? defaults.weighInReminderWeekday,
    weighInReminderHour: extras.weighInReminderHour ?? defaults.weighInReminderHour,
    weighInReminderMinute: extras.weighInReminderMinute ?? defaults.weighInReminderMinute,
  };
}

function buildInitialSnapshot(
  profile: UserProfile,
  extras: ProfileExtras,
): SettingsSnapshot {
  const [p, c, f] = macroIntsFromProfile(profile);
  return {
    draft: profileDraftFromProfile(profile, extras),
    macroProteinPct: p,
    macroCarbsPct: c,
    macroFatPct: f,
    startingWeightKg: profile.startingWeightKg,
    useLbsForWeight: extras.useLbsForWeight,
    useImperialForHeight: extras.useImperialForHeight,
    reminderPrefs: reminderPrefsFromExtras(extras),
  };
}

function snapshotsEqual(a: SettingsSnapshot, b: SettingsSnapshot): boolean {
  return (
    JSON.stringify(a.draft) === JSON.stringify(b.draft) &&
    a.macroProteinPct === b.macroProteinPct &&
    a.macroCarbsPct === b.macroCarbsPct &&
    a.macroFatPct === b.macroFatPct &&
    a.startingWeightKg === b.startingWeightKg &&
    a.useLbsForWeight === b.useLbsForWeight &&
    a.useImperialForHeight === b.useImperialForHeight &&
    JSON.stringify(a.reminderPrefs) === JSON.stringify(b.reminderPrefs)
  );
}

export function useSettingsForm(profile: UserProfile, extras: ProfileExtras) {
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    buildInitialSnapshot(profile, extras),
  );
  const [draft, setDraft] = useState(() => savedSnapshot.draft);
  const [macroProteinPct, setMacroProteinPct] = useState(
    () => savedSnapshot.macroProteinPct,
  );
  const [macroCarbsPct, setMacroCarbsPct] = useState(
    () => savedSnapshot.macroCarbsPct,
  );
  const [macroFatPct, setMacroFatPct] = useState(() => savedSnapshot.macroFatPct);
  const [startingWeightKg, setStartingWeightKg] = useState(
    () => savedSnapshot.startingWeightKg,
  );
  const [useLbsForWeight, setUseLbsForWeight] = useState(
    () => savedSnapshot.useLbsForWeight,
  );
  const [useImperialForHeight, setUseImperialForHeight] = useState(
    () => savedSnapshot.useImperialForHeight,
  );
  const [reminderPrefs, setReminderPrefs] = useState(
    () => savedSnapshot.reminderPrefs,
  );
  const [hardDeficitUnlocked, setHardDeficitUnlocked] = useState(
    () => savedSnapshot.draft.requestedDeficit > AppConstants.Deficit.maxDeficitKcal,
  );
  const [showHardDeficitAlert, setShowHardDeficitAlert] = useState(false);

  // current weight from weigh-ins (read-only for settings)
  const currentWeightKg = extras.currentWeightKg;
  const savedStartingWeightKg = savedSnapshot.startingWeightKg;

  const previewResult = useMemo(
    () =>
      preview({
        sex: draft.sex,
        dateOfBirth: draft.dateOfBirth,
        heightCm: draft.heightCm,
        weightKg: currentWeightKg,
        activityLevel: draft.activityLevel,
        deficitKcal: draft.requestedDeficit,
      }),
    [draft, currentWeightKg],
  );

  const previewGoalTargetDate = useMemo(
    () =>
      computeGoalTargetDate({
        currentWeightKg,
        goalWeightKg: draft.goalWeightKg,
        heightCm: draft.heightCm,
        dateOfBirth: draft.dateOfBirth,
        sex: draft.sex,
        activityLevel: draft.activityLevel,
        deficitKcal: previewResult.deficitKcal,
        referenceDate: new Date(),
      }),
    [draft, currentWeightKg, previewResult.deficitKcal],
  );

  const updateDeficit = useCallback(
    (value: number) => {
      const maxAllowed = hardDeficitUnlocked
        ? AppConstants.Deficit.hardMaxDeficitKcal
        : AppConstants.Deficit.maxDeficitKcal;

      if (
        value > AppConstants.Deficit.maxDeficitKcal &&
        !hardDeficitUnlocked
      ) {
        setShowHardDeficitAlert(true);
        return;
      }

      setDraft((prev) => ({
        ...prev,
        requestedDeficit: Math.min(
          Math.max(value, AppConstants.Deficit.minDeficitKcal),
          maxAllowed,
        ),
      }));
    },
    [hardDeficitUnlocked],
  );

  const unlockHardDeficit = useCallback(() => {
    setHardDeficitUnlocked(true);
    setShowHardDeficitAlert(false);
    setDraft((prev) => {
      if (prev.requestedDeficit <= AppConstants.Deficit.maxDeficitKcal) {
        return prev;
      }
      return {
        ...prev,
        requestedDeficit: Math.min(
          prev.requestedDeficit,
          AppConstants.Deficit.hardMaxDeficitKcal,
        ),
      };
    });
  }, []);

  const updateDraft = useCallback((update: (d: ProfileDraft) => void) => {
    setDraft((prev) => {
      const next = { ...prev };
      update(next);
      return next;
    });
  }, []);

  const adjustMacro = useCallback(
    (changed: MacroKind, newValue: number) => {
      const [p, c, f] = adjustMacroPercents(
        changed,
        newValue,
        macroProteinPct,
        macroCarbsPct,
        macroFatPct,
      );
      setMacroProteinPct(p);
      setMacroCarbsPct(c);
      setMacroFatPct(f);
    },
    [macroProteinPct, macroCarbsPct, macroFatPct],
  );

  const macroSum = macroProteinPct + macroCarbsPct + macroFatPct;

  const canSave = useMemo(
    () =>
      canSaveSettings(
        draft,
        {
          protein: macroProteinPct,
          carbs: macroCarbsPct,
          fat: macroFatPct,
        },
        startingWeightKg,
        currentWeightKg,
      ),
    [draft, macroProteinPct, macroCarbsPct, macroFatPct, startingWeightKg, currentWeightKg],
  );

  const validationMessage = useMemo(
    () =>
      settingsValidationMessage(
        draft,
        {
          protein: macroProteinPct,
          carbs: macroCarbsPct,
          fat: macroFatPct,
        },
        startingWeightKg,
        currentWeightKg,
      ),
    [draft, macroProteinPct, macroCarbsPct, macroFatPct, startingWeightKg, currentWeightKg],
  );

  const isDirty = useMemo(() => {
    const current: SettingsSnapshot = {
      draft,
      macroProteinPct,
      macroCarbsPct,
      macroFatPct,
      startingWeightKg,
      useLbsForWeight,
      useImperialForHeight,
      reminderPrefs,
    };
    return !snapshotsEqual(current, savedSnapshot);
  }, [
    draft,
    macroProteinPct,
    macroCarbsPct,
    macroFatPct,
    startingWeightKg,
    useLbsForWeight,
    useImperialForHeight,
    reminderPrefs,
    savedSnapshot,
  ]);

  const markSaved = useCallback(() => {
    setSavedSnapshot({
      draft: { ...draft },
      macroProteinPct,
      macroCarbsPct,
      macroFatPct,
      startingWeightKg,
      useLbsForWeight,
      useImperialForHeight,
      reminderPrefs: { ...reminderPrefs },
    });
  }, [
    draft,
    macroProteinPct,
    macroCarbsPct,
    macroFatPct,
    startingWeightKg,
    useLbsForWeight,
    useImperialForHeight,
    reminderPrefs,
  ]);

  const applySavedValues = useCallback(
    (saved: { draft: ProfileDraft; startingWeightKg: number }) => {
      setDraft(saved.draft);
      setStartingWeightKg(saved.startingWeightKg);
      setSavedSnapshot({
        draft: { ...saved.draft },
        macroProteinPct,
        macroCarbsPct,
        macroFatPct,
        startingWeightKg: saved.startingWeightKg,
        useLbsForWeight,
        useImperialForHeight,
        reminderPrefs: { ...reminderPrefs },
      });
    },
    [
      macroProteinPct,
      macroCarbsPct,
      macroFatPct,
      useLbsForWeight,
      useImperialForHeight,
      reminderPrefs,
    ],
  );

  return {
    draft,
    updateDraft,
    macroProteinPct,
    macroCarbsPct,
    macroFatPct,
    macroSum,
    adjustMacro,
    startingWeightKg,
    setStartingWeightKg,
    savedStartingWeightKg,
    currentWeightKg,
    useLbsForWeight,
    setUseLbsForWeight,
    useImperialForHeight,
    setUseImperialForHeight,
    reminderPrefs,
    setReminderPrefs,
    previewTDEE: previewResult.tdee,
    previewTarget: previewResult.dailyTarget,
    previewDeficit: previewResult.deficitKcal,
    previewGoalTargetDate,
    minimumCalories: previewResult.minimumCalories,
    hardDeficitUnlocked,
    showHardDeficitAlert,
    setShowHardDeficitAlert,
    updateDeficit,
    unlockHardDeficit,
    canSave,
    validationMessage,
    isDirty,
    markSaved,
    applySavedValues,
  };
}
