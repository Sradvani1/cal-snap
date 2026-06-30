export const onboardingCopy = {
  'onboarding.step.welcome': 'Welcome',
  'onboarding.step.profileSetup': 'Your profile',
  'onboarding.step.goalSetup': 'Your goal',
  'onboarding.step.caloriePreview': 'Calorie target',
  'onboarding.step.done': 'All set',
  'onboarding.welcome.title': 'Welcome to CalSnap',
  'onboarding.welcome.tagline': 'Eat smart. Lose weight. No obsession.',
  'onboarding.welcome.cloudNote':
    'Your profile is stored securely in the cloud so you can pick up where you left off on any device.',
  'onboarding.profile.title': 'About you',
  'onboarding.profile.subtitle': 'Tell us a bit about yourself.',
  'onboarding.profile.currentWeight': 'Current weight',
  'onboarding.goal.title': 'Your goal',
  'onboarding.goal.subtitle': 'Where do you want to be?',
  'onboarding.goal.weight': 'Goal weight',
  'onboarding.goal.targetDate': 'Target date',
  'onboarding.goal.minWeeksHint': 'At least 2 weeks from today',
  'onboarding.calorie.title': 'Your calorie target',
  'onboarding.calorie.subtitle': 'Based on your profile and activity level.',
  'onboarding.calorie.deficit': 'Daily deficit',
  'onboarding.calorie.recommended': 'Recommended: {{min}}–{{max}} kcal/day',
  'onboarding.calorie.macroTargets': 'Macro targets',
  'onboarding.calorie.macroDefaultsNote':
    'Macro split follows evidence-based defaults (28% protein, 47% carbs, 25% fat), within ±15% of common recommendations.',
  'onboarding.calorie.hardDeficit.title': 'High deficit warning',
  'onboarding.calorie.hardDeficit.body':
    'Deficits above {{max}} kcal/day can trigger metabolic adaptation. Continue only if you understand the risks.',
  'onboarding.calorie.hardDeficit.continue': 'I understand, continue',
  'onboarding.done.title': "You're all set!",
  'onboarding.done.redirecting':
    'Your profile has been saved. Taking you to your dashboard…',
  'onboarding.validation.ageRange': 'Age must be between {{min}} and {{max}} years.',
  'onboarding.validation.heightRange':
    'Height must be between {{min}} and {{max}} cm.',
  'onboarding.validation.weightRange': 'Weight must be within a valid range.',
  'onboarding.validation.goalDateRange':
    'Goal date must be {{min}}–{{max}} days from today.',
  'onboarding.validation.requiredFields': 'Please complete required fields.',
  'onboarding.error.saveFailed': 'Failed to save profile. Please try again.',
  'onboarding.warning.deficitCapped': 'Deficit capped at {{max}} kcal/day for safety.',
  'onboarding.warning.highDeficit':
    'Deficits above {{max}} kcal/day can trigger metabolic adaptation. Recommend 350 kcal/day.',
  'onboarding.warning.targetFloored':
    'Target floored to {{minimum}} kcal/day minimum for safety.',
} as const;

export type OnboardingCopyKey = keyof typeof onboardingCopy;
