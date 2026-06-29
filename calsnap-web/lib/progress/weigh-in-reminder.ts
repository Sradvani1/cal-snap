import { daysBetween } from '@/lib/dashboard/date-window';
import type { WeighIn } from '@/lib/models/weigh-in';
import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { isWeighInSnoozed } from '@/lib/progress/weigh-in-snooze';

const OVERDUE_DAYS = 7;

export function shouldShowWeighInReminderBanner(input: {
  prefs: ResolvedReminderPrefs;
  latestWeighIn: WeighIn | undefined;
  profileCreatedAt: Date;
  uid: string;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();

  if (!input.prefs.weighInReminderEnabled) {
    return false;
  }

  if (isWeighInSnoozed(input.uid, now)) {
    return false;
  }

  const daysSinceReference = input.latestWeighIn
    ? daysBetween(input.latestWeighIn.date, now)
    : daysBetween(input.profileCreatedAt, now);

  return daysSinceReference >= OVERDUE_DAYS;
}
