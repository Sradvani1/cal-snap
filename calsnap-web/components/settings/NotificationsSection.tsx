'use client';

import { SectionCard } from '@/components/design/SectionCard';
import { formFieldInputClassName } from '@/lib/design/form-field';
import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

const WEEKDAY_OPTIONS = [
  { value: 0, labelKey: 'common.weekday.sunday' as const },
  { value: 1, labelKey: 'common.weekday.monday' as const },
  { value: 2, labelKey: 'common.weekday.tuesday' as const },
  { value: 3, labelKey: 'common.weekday.wednesday' as const },
  { value: 4, labelKey: 'common.weekday.thursday' as const },
  { value: 5, labelKey: 'common.weekday.friday' as const },
  { value: 6, labelKey: 'common.weekday.saturday' as const },
];

interface NotificationsSectionProps {
  reminderPrefs: ResolvedReminderPrefs;
  onChange: (prefs: ResolvedReminderPrefs) => void;
}

const inputClassName = formFieldInputClassName;

export function NotificationsSection({
  reminderPrefs,
  onChange,
}: NotificationsSectionProps) {
  const timeValue = `${String(reminderPrefs.weighInReminderHour).padStart(2, '0')}:${String(reminderPrefs.weighInReminderMinute).padStart(2, '0')}`;

  return (
    <SectionCard title={copy('settings.section.weighInReminder')}>
      <div className="flex flex-col gap-4">
        <p className={cn(typography.csCaption, 'break-words text-xs')}>
          {copy('settings.reminder.futureNote')}
        </p>

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

        <label className={cn(typography.csMacroLabel, 'flex min-w-0 flex-col gap-1')}>
          {copy('settings.reminder.dayOfWeek')}
          <select
            value={reminderPrefs.weighInReminderWeekday}
            onChange={(event) =>
              onChange({
                ...reminderPrefs,
                weighInReminderWeekday: Number(event.target.value),
              })
            }
            className={inputClassName}
          >
            {WEEKDAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {copy(day.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className={cn(typography.csMacroLabel, 'flex min-w-0 flex-col gap-1')}>
          {copy('settings.reminder.time')}
          <input
            type="time"
            value={timeValue}
            onChange={(event) => {
              const [hour, minute] = event.target.value.split(':').map(Number);
              onChange({
                ...reminderPrefs,
                weighInReminderHour: hour,
                weighInReminderMinute: minute,
              });
            }}
            className={inputClassName}
          />
        </label>
      </div>
    </SectionCard>
  );
}
