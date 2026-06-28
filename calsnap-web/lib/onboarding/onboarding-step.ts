export const ONBOARDING_STEPS = [
  'welcome',
  'profileSetup',
  'goalSetup',
  'caloriePreview',
  'done',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_TITLES: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  profileSetup: 'Your profile',
  goalSetup: 'Your goal',
  caloriePreview: 'Calorie target',
  done: 'All set',
};

export function onboardingStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function onboardingProgress(step: OnboardingStep): number {
  return (onboardingStepIndex(step) + 1) / ONBOARDING_STEPS.length;
}
