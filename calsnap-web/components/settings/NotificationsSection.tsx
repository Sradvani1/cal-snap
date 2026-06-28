'use client';

import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface NotificationsSectionProps {
  reminderPrefs: ResolvedReminderPrefs;
  onChange: (prefs: ResolvedReminderPrefs) => void;
}

export function NotificationsSection({
  reminderPrefs,
  onChange,
}: NotificationsSectionProps) {
  const timeValue = `${String(reminderPrefs.weighInReminderHour).padStart(2, '0')}:${String(reminderPrefs.weighInReminderMinute).padStart(2, '0')}`;

  return (
    <SettingsSectionCard title="Weigh-in reminder">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-neutral-500">
          Reminder delivery coming in a future update. Preferences are saved with your profile.
        </p>

        <label className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700">Enable weekly reminder</span>
          <input
            type="checkbox"
            checked={reminderPrefs.weighInReminderEnabled}
            onChange={(event) =>
              onChange({ ...reminderPrefs, weighInReminderEnabled: event.target.checked })
            }
            className="h-4 w-4"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Day of week</span>
          <select
            value={reminderPrefs.weighInReminderWeekday}
            onChange={(event) =>
              onChange({
                ...reminderPrefs,
                weighInReminderWeekday: Number(event.target.value),
              })
            }
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            {WEEKDAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Time</span>
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
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>
    </SettingsSectionCard>
  );
}
