import type { ActivityLevel } from '@/lib/models/activity-level';

export const ACTIVITY_LEVEL_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 'lightlyActive', label: 'Lightly active', description: '1–3 days/week' },
  { value: 'moderatelyActive', label: 'Moderately active', description: '3–5 days/week' },
  { value: 'veryActive', label: 'Very active', description: '6–7 days/week' },
  { value: 'extraActive', label: 'Extra active', description: 'Athlete or physical job' },
];
