'use client';

import { useCallback, useMemo, useState } from 'react';
import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
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
import { saveProfileFromDraft } from '@/lib/repositories/profile';

export interface OnboardingTargets {
  tdee: number;
  target: number;
  deficit: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  warnings: string[];
}

export function useOnboarding(uid: string) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(createDefaultProfileDraft);
  const [hardDeficitUnlocked, setHardDeficitUnlocked] = useState(false);
  const [showHardDeficitAlert, setShowHardDeficitAlert] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState<OnboardingTargets>({
    tdee: 0,
    target: 0,
    deficit: AppConstants.Deficit.defaultDeficitKcal,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    warnings: [],
  });

  const progress = useMemo(() => onboardingProgress(currentStep), [currentStep]);

  const updateDraft = useCallback((update: (draft: ProfileDraft) => void) => {
    setProfileDraft((prev) => {
      const next = { ...prev };
      update(next);
      return next;
    });
  }, []);

  const calculateTargets = useCallback((draft: ProfileDraft = profileDraft) => {
    const age = ageFromDateOfBirth(draft.dateOfBirth);
    const bmrValue = bmr(draft.weightKg, draft.heightCm, age, draft.sex);
    const tdeeValue = tdee(bmrValue, draft.activityLevel);
    const targetResult = dailyTarget(tdeeValue, draft.requestedDeficit, draft.sex);
    const macros = macroTargets(
      targetResult.target,
      AppConstants.Nutrition.defaultMacroProteinPct,
      AppConstants.Nutrition.defaultMacroCarbsPct,
      AppConstants.Nutrition.defaultMacroFatPct,
    );

    setTargets({
      tdee: Math.round(tdeeValue),
      target: targetResult.target,
      deficit: targetResult.deficit,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
      warnings: targetResult.warnings,
    });
  }, [profileDraft]);

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
      await saveProfileFromDraft(uid, draftForSave);
    } finally {
      setSaving(false);
    }
  }, [uid, profileDraft]);

  const advance = useCallback(async () => {
    setValidationError(null);

    if (currentStep === 'profileSetup') {
      const normalized = normalizeProfileSetupDraft(profileDraft);
      if (!canAdvanceProfileSetup(normalized)) {
        setValidationError(validationMessageForStep('profileSetup', normalized));
        return;
      }
      setProfileDraft(normalized);
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
  };
}
