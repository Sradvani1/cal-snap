import type { ActivityLevel } from '@/lib/models/activity-level';
import { copy } from '@/lib/copy';

export const ACTIVITY_LEVEL_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 'sedentary',
    label: copy('common.activity.sedentary.label'),
    description: copy('common.activity.sedentary.description'),
  },
  {
    value: 'lightlyActive',
    label: copy('common.activity.lightlyActive.label'),
    description: copy('common.activity.lightlyActive.description'),
  },
  {
    value: 'moderatelyActive',
    label: copy('common.activity.moderatelyActive.label'),
    description: copy('common.activity.moderatelyActive.description'),
  },
  {
    value: 'veryActive',
    label: copy('common.activity.veryActive.label'),
    description: copy('common.activity.veryActive.description'),
  },
  {
    value: 'extraActive',
    label: copy('common.activity.extraActive.label'),
    description: copy('common.activity.extraActive.description'),
  },
];
