import { AppConstants } from '@/lib/constants';

export type ActivityLevel =
  | 'sedentary'
  | 'lightlyActive'
  | 'moderatelyActive'
  | 'veryActive'
  | 'extraActive';

export function activityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case 'sedentary':
      return AppConstants.ActivityMultipliers.sedentary;
    case 'lightlyActive':
      return AppConstants.ActivityMultipliers.lightlyActive;
    case 'moderatelyActive':
      return AppConstants.ActivityMultipliers.moderatelyActive;
    case 'veryActive':
      return AppConstants.ActivityMultipliers.veryActive;
    case 'extraActive':
      return AppConstants.ActivityMultipliers.extraActive;
  }
}
