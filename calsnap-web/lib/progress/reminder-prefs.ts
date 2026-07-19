import type { ProfileDoc, ProfileExtras } from '@/lib/models/profile-doc';

export interface ResolvedReminderPrefs {
  weighInReminderEnabled: boolean;
}

export function defaultReminderPrefs(): ResolvedReminderPrefs {
  return {
    weighInReminderEnabled: true,
  };
}

export function resolveReminderPrefsFromExtras(
  extras: Pick<ProfileExtras, 'weighInReminderEnabled'>,
): ResolvedReminderPrefs {
  return {
    weighInReminderEnabled: extras.weighInReminderEnabled ?? true,
  };
}

export function resolveReminderPrefs(doc: ProfileDoc): ResolvedReminderPrefs {
  return {
    weighInReminderEnabled: doc.weighInReminderEnabled ?? true,
  };
}
