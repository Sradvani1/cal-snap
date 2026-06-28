import { copy } from '@/lib/copy';

export const ONBOARDING_STEPS = [
  'welcome',
  'profileSetup',
  'goalSetup',
  'caloriePreview',
  'done',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_TITLES: Record<OnboardingStep, string> = {
  welcome: copy('onboarding.step.welcome'),
  profileSetup: copy('onboarding.step.profileSetup'),
  goalSetup: copy('onboarding.step.goalSetup'),
  caloriePreview: copy('onboarding.step.caloriePreview'),
  done: copy('onboarding.step.done'),
};

export function onboardingStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function onboardingProgress(step: OnboardingStep): number {
  return (onboardingStepIndex(step) + 1) / ONBOARDING_STEPS.length;
}
