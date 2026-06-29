'use client';

import { useState } from 'react';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';
import { snoozeWeighInUntilTomorrow } from '@/lib/progress/weigh-in-snooze';
import { typography } from '@/lib/design/typography';

interface WeighInReminderBannerProps {
  uid: string;
  onLogNow: () => void;
}

export function WeighInReminderBanner({ uid, onLogNow }: WeighInReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleRemindTomorrow = () => {
    snoozeWeighInUntilTomorrow(uid);
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className="rounded-2xl border border-cs-accent/40 bg-cs-accent/10 p-4 shadow-sm"
    >
      <p className={`${typography.csCardTitle} text-cs-foreground`}>
        {copy('dashboard.reminder.title')}
      </p>
      <p className={`${typography.csCaption} mt-1`}>{copy('dashboard.reminder.body')}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <PrimaryButton type="button" onClick={onLogNow} className="min-h-11 flex-1">
          {copy('dashboard.reminder.logNow')}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          onClick={handleRemindTomorrow}
          className="min-h-11 flex-1"
        >
          {copy('dashboard.reminder.remindTomorrow')}
        </SecondaryButton>
      </div>
    </div>
  );
}
