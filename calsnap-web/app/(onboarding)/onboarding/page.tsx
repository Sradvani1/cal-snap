'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { CalorieTargetPreviewStep } from '@/components/onboarding/CalorieTargetPreviewStep';
import { GoalSetupStep } from '@/components/onboarding/GoalSetupStep';
import { OnboardingDoneStep } from '@/components/onboarding/OnboardingDoneStep';
import { ProfileSetupStep } from '@/components/onboarding/ProfileSetupStep';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { useAuth } from '@/lib/auth/use-auth';
import { ONBOARDING_STEP_TITLES } from '@/lib/onboarding/onboarding-step';
import { useOnboarding } from '@/lib/onboarding/use-onboarding';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

export default function OnboardingPage() {
  const { user, loading, sessionError } = useAuth();
  const router = useRouter();
  const onboarding = useOnboarding(user?.uid ?? '');

  const handleDone = useCallback(() => {
    router.replace('/dashboard');
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className={typography.csCaption}>{copy('common.loading')}</p>
      </div>
    );
  }

  const { currentStep } = onboarding;
  const showBack = currentStep !== 'welcome' && currentStep !== 'done';
  const showContinue = currentStep !== 'done';

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-8">
      <div className="mb-6">
        <div className={`${typography.csCaption} mb-2 flex items-center justify-between text-xs`}>
          <span>{ONBOARDING_STEP_TITLES[currentStep]}</span>
          <span>{Math.round(onboarding.progress * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-cs-muted/20">
          <div
            className="h-full bg-cs-primary transition-all"
            style={{ width: `${onboarding.progress * 100}%` }}
          />
        </div>
      </div>

      <SessionErrorBanner message={sessionError} />

      <div className="flex-1">
        {currentStep === 'welcome' && <WelcomeStep />}
        {currentStep === 'profileSetup' && (
          <ProfileSetupStep draft={onboarding.profileDraft} onUpdate={onboarding.updateDraft} />
        )}
        {currentStep === 'goalSetup' && (
          <GoalSetupStep draft={onboarding.profileDraft} onUpdate={onboarding.updateDraft} />
        )}
        {currentStep === 'caloriePreview' && (
          <CalorieTargetPreviewStep
            targets={onboarding.targets}
            deficit={onboarding.profileDraft.requestedDeficit}
            hardDeficitUnlocked={onboarding.hardDeficitUnlocked}
            showHardDeficitAlert={onboarding.showHardDeficitAlert}
            onDeficitChange={onboarding.updateDeficit}
            onUnlockHardDeficit={onboarding.unlockHardDeficit}
            onDismissHardDeficitAlert={() => onboarding.setShowHardDeficitAlert(false)}
          />
        )}
        {currentStep === 'done' && <OnboardingDoneStep onComplete={handleDone} />}
      </div>

      {onboarding.validationError && (
        <p className="mt-4 text-sm text-cs-danger">{onboarding.validationError}</p>
      )}

      {(showBack || showContinue) && (
        <div className="mt-8 flex gap-3">
          {showBack && (
            <SecondaryButton type="button" onClick={onboarding.goBack} fullWidth className="min-h-11">
              {copy('common.button.back')}
            </SecondaryButton>
          )}
          {showContinue && (
            <PrimaryButton
              type="button"
              disabled={onboarding.saving}
              onClick={() => void onboarding.advance()}
              fullWidth
              className="min-h-11"
            >
              {onboarding.saving
                ? copy('common.button.saving')
                : currentStep === 'caloriePreview'
                  ? copy('common.button.saveContinue')
                  : copy('common.button.continue')}
            </PrimaryButton>
          )}
        </div>
      )}
    </div>
  );
}
