'use client';

import { SectionCard } from '@/components/design/SectionCard';
import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface NotificationsSectionProps {
  reminderPrefs: ResolvedReminderPrefs;
  onChange: (prefs: ResolvedReminderPrefs) => void;
}

export function NotificationsSection({
  reminderPrefs,
  onChange,
}: NotificationsSectionProps) {
  return (
    <SectionCard title={copy('settings.section.weighInReminder')}>
      <label
        className={cn(
          typography.csMacroLabel,
          'flex min-w-0 items-center justify-between gap-3',
        )}
      >
        {copy('settings.reminder.enable')}
        <input
          type="checkbox"
          checked={reminderPrefs.weighInReminderEnabled}
          onChange={(event) =>
            onChange({ ...reminderPrefs, weighInReminderEnabled: event.target.checked })
          }
          className="h-4 w-4 shrink-0"
        />
      </label>
    </SectionCard>
  );
}
