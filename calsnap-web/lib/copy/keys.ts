import { analyticsCopy } from './analytics';
import { authCopy } from './auth';
import { commonCopy } from './common';
import { dashboardCopy } from './dashboard';
import { designSystemCopy } from './design-system';
import { mealLogCopy } from './meal-log';
import { onboardingCopy } from './onboarding';
import { progressCopy } from './progress';
import { scannerCopy } from './scanner';
import { settingsCopy } from './settings';

export const COPY_REGISTRY = {
  ...designSystemCopy,
  ...commonCopy,
  ...authCopy,
  ...onboardingCopy,
  ...dashboardCopy,
  ...scannerCopy,
  ...mealLogCopy,
  ...progressCopy,
  ...analyticsCopy,
  ...settingsCopy,
} as const;

export type CopyKey = keyof typeof COPY_REGISTRY;
