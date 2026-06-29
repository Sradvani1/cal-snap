import { AppConstants } from '@/lib/constants';
import type { ProfileDoc, ProfileExtras } from '@/lib/models/profile-doc';

export interface ResolvedReminderPrefs {
  weighInReminderEnabled: boolean;
  weighInReminderWeekday: number;
  weighInReminderHour: number;
  weighInReminderMinute: number;
}

export function defaultReminderPrefs(): ResolvedReminderPrefs {
  return {
    weighInReminderEnabled: true,
    weighInReminderWeekday: AppConstants.Notifications.defaultReminderWeekday,
    weighInReminderHour: AppConstants.Notifications.defaultReminderHour,
    weighInReminderMinute: AppConstants.Notifications.defaultReminderMinute,
  };
}

export function resolveReminderPrefsFromExtras(
  extras: Pick<
    ProfileExtras,
    | 'weighInReminderEnabled'
    | 'weighInReminderWeekday'
    | 'weighInReminderHour'
    | 'weighInReminderMinute'
  >,
): ResolvedReminderPrefs {
  return resolveReminderPrefs(extras as ProfileDoc);
}

export function resolveReminderPrefs(doc: ProfileDoc): ResolvedReminderPrefs {
  const defaults = defaultReminderPrefs();
  return {
    weighInReminderEnabled: doc.weighInReminderEnabled ?? defaults.weighInReminderEnabled,
    weighInReminderWeekday: doc.weighInReminderWeekday ?? defaults.weighInReminderWeekday,
    weighInReminderHour: doc.weighInReminderHour ?? defaults.weighInReminderHour,
    weighInReminderMinute: doc.weighInReminderMinute ?? defaults.weighInReminderMinute,
  };
}
