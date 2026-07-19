'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { getPresetValues, type MacroPresetKey } from '@/lib/models/macro-preset';
import type { OnboardingStep } from '@/lib/onboarding/onboarding-step';
import { onboardingProgress } from '@/lib/onboarding/onboarding-step';
import {
  createDefaultProfileDraft,
  trimmedName,
  type ProfileDraft,
} from '@/lib/onboarding/profile-draft';
import {
  canAdvanceProfileSetup,
  canAdvanceGoalSetup,
  normalizeProfileSetupDraft,
  normalizeGoalSetupDraft,
  validationMessageForStep,
} from '@/lib/onboarding/validation';
import {
  ageFromDateOfBirth,
  bmr,
  dailyTarget,
  macroTargets,
  tdee,
} from '@/lib/nutrition/calculator';
import { computeGoalTargetDate } from '@/lib/nutrition/goal-pathway';
import { queryKeys } from '@/lib/queries/query-keys';
import { saveProfileFromDraft } from '@/lib/repositories/profile';

export interface OnboardingTargets {
  tdee: number;
  target: number;
  deficit: number;
  proteinG: number;
  totalCarbsG: number;
  fatG: number;
  fiberG: number;
  warnings: string[];
  goalTargetDate: Date | null;
}

export function useOnboarding(uid: string) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(createDefaultProfileDraft);
  const [hardDeficitUnlocked, setHardDeficitUnlocked] = useState(false);
  const [showHardDeficitAlert, setShowHardDeficitAlert] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [macroPresetKey, setMacroPresetKeyState] = useState<MacroPresetKey>('balanced');
  const [targets, setTargets] = useState<OnboardingTargets>({
    tdee: 0,
    target: 0,
    deficit: AppConstants.Deficit.defaultDeficitKcal,
    proteinG: 0,
    totalCarbsG: 0,
    fatG: 0,
    fiberG: 0,
    warnings: [],
    goalTargetDate: null,
  });

  const progress = useMemo(() => onboardingProgress(currentStep), [currentStep]);

  const updateDraft = useCallback((update: (draft: ProfileDraft) => void) => {
    setProfileDraft((prev) => {
      const next = { ...prev };
      update(next);
      return next;
    });
  }, []);

  const calculateTargets = useCallback((draft: ProfileDraft = profileDraft, preset?: MacroPresetKey) => {
    const referenceDate = new Date();
    const age = ageFromDateOfBirth(draft.dateOfBirth, referenceDate);
    const bmrValue = bmr(draft.weightKg, draft.heightCm, age, draft.sex);
    const tdeeValue = tdee(bmrValue, draft.activityLevel);
    const targetResult = dailyTarget(tdeeValue, draft.requestedDeficit, draft.sex);
    const presetValues = getPresetValues(preset ?? macroPresetKey);
    const macros = macroTargets(
      targetResult.target,
      presetValues.proteinPct / 100,
      presetValues.carbsPct / 100,
      presetValues.fatPct / 100,
    );
    const goalTargetDate = computeGoalTargetDate({
      currentWeightKg: draft.weightKg,
      goalWeightKg: draft.goalWeightKg,
      heightCm: draft.heightCm,
      dateOfBirth: draft.dateOfBirth,
      sex: draft.sex,
      activityLevel: draft.activityLevel,
      deficitKcal: targetResult.deficit,
      referenceDate,
    });

    setTargets({
      tdee: Math.round(tdeeValue),
      target: targetResult.target,
      deficit: targetResult.deficit,
      proteinG: macros.proteinG,
      totalCarbsG: macros.totalCarbsG,
      fatG: macros.fatG,
      fiberG: macros.fiberG,
      warnings: targetResult.warnings,
      goalTargetDate,
    });
  }, [profileDraft, macroPresetKey]);

  const setMacroPresetKey = useCallback((key: MacroPresetKey) => {
    setMacroPresetKeyState(key);
    updateDraft((d) => { d.macroPresetKey = key; });
    calculateTargets(profileDraft, key);
  }, [updateDraft, calculateTargets, profileDraft]);

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

      updateDraft((draft) => {
        draft.requestedDeficit = Math.min(
          Math.max(value, AppConstants.Deficit.minDeficitKcal),
          maxAllowed,
        );
      });
      calculateTargets({
        ...profileDraft,
        requestedDeficit: Math.min(
          Math.max(value, AppConstants.Deficit.minDeficitKcal),
          maxAllowed,
        ),
      });
    },
    [hardDeficitUnlocked, updateDraft, calculateTargets, profileDraft],
  );

  const unlockHardDeficit = useCallback(() => {
    setHardDeficitUnlocked(true);
    setShowHardDeficitAlert(false);
    if (profileDraft.requestedDeficit > AppConstants.Deficit.maxDeficitKcal) {
      updateDeficit(profileDraft.requestedDeficit);
    }
  }, [profileDraft.requestedDeficit, updateDeficit]);

  const canAdvance = useCallback(
    (step: OnboardingStep = currentStep): boolean => {
      switch (step) {
        case 'welcome':
          return true;
        case 'profileSetup':
          return canAdvanceProfileSetup(normalizeProfileSetupDraft(profileDraft));
        case 'goalSetup':
          return canAdvanceGoalSetup(normalizeGoalSetupDraft(profileDraft));
        case 'caloriePreview':
        case 'done':
          return true;
        default:
          return false;
      }
    },
    [currentStep, profileDraft],
  );

  const goBack = useCallback(() => {
    setValidationError(null);
    switch (currentStep) {
      case 'welcome':
        break;
      case 'profileSetup':
        setCurrentStep('welcome');
        break;
      case 'goalSetup':
        setCurrentStep('profileSetup');
        break;
      case 'caloriePreview':
        setCurrentStep('goalSetup');
        break;
      case 'done':
        setCurrentStep('caloriePreview');
        calculateTargets();
        break;
      default:
        break;
    }
  }, [currentStep, calculateTargets]);

  const saveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const draftForSave = {
        ...profileDraft,
        name: trimmedName(profileDraft),
      };
      const saved = await saveProfileFromDraft(uid, draftForSave);
      queryClient.setQueryData(queryKeys.profile(uid), saved);
    } finally {
      setSaving(false);
    }
  }, [uid, profileDraft, queryClient]);

  const advance = useCallback(async () => {
    setValidationError(null);

    if (currentStep === 'profileSetup') {
      const normalized = normalizeProfileSetupDraft(profileDraft);
      if (!canAdvanceProfileSetup(normalized)) {
        setValidationError(validationMessageForStep('profileSetup', normalized));
        return;
      }
      setProfileDraft({
        ...normalized,
        goalWeightKg: Math.round(normalized.weightKg * (1 - AppConstants.Onboarding.defaultGoalWeightLossPct)),
      });
      setCurrentStep('goalSetup');
      return;
    }

    if (currentStep === 'goalSetup') {
      const normalized = normalizeGoalSetupDraft(profileDraft);
      if (!canAdvanceGoalSetup(normalized)) {
        setValidationError(validationMessageForStep('goalSetup', normalized));
        return;
      }
      setProfileDraft(normalized);
      setCurrentStep('caloriePreview');
      calculateTargets(normalized);
      return;
    }

    if (!canAdvance()) {
      setValidationError(copy('onboarding.validation.requiredFields'));
      return;
    }

    switch (currentStep) {
      case 'welcome':
        setCurrentStep('profileSetup');
        break;
      case 'caloriePreview':
        try {
          await saveProfile();
          setCurrentStep('done');
        } catch (err) {
          setValidationError(
            err instanceof Error ? err.message : copy('onboarding.error.saveFailed'),
          );
        }
        break;
      case 'done':
        break;
      default:
        break;
    }
  }, [canAdvance, currentStep, profileDraft, calculateTargets, saveProfile]);

  return {
    currentStep,
    profileDraft,
    progress,
    targets,
    hardDeficitUnlocked,
    showHardDeficitAlert,
    setShowHardDeficitAlert,
    validationError,
    saving,
    updateDraft,
    updateDeficit,
    unlockHardDeficit,
    canAdvance,
    advance,
    goBack,
    calculateTargets,
    macroPresetKey,
    setMacroPresetKey,
  };
}
