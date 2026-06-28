'use client';

import { useState } from 'react';
import { AppDialog } from '@/components/design/AppDialog';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import { copy } from '@/lib/copy';
import { useWeighInForm } from '@/lib/progress/use-weigh-in-form';
import { snoozeWeighInUntilTomorrow } from '@/lib/progress/weigh-in-snooze';
import { useLogWeighIn } from '@/lib/queries/use-log-weigh-in';
import type { SaveWeighInResult } from '@/lib/services/weigh-in-service';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface WeighInSheetProps {
  open: boolean;
  uid: string;
  profile: UserProfile;
  profileExtras: ProfileExtras;
  onClose: () => void;
  onSaved?: (result: SaveWeighInResult) => void;
}

interface WeighInSheetFormProps {
  uid: string;
  profile: UserProfile;
  profileExtras: ProfileExtras;
  onClose: () => void;
  onSaved?: (result: SaveWeighInResult) => void;
}

function WeighInSheetForm({
  uid,
  profile,
  profileExtras,
  onClose,
  onSaved,
}: WeighInSheetFormProps) {
  const logMutation = useLogWeighIn(uid);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useWeighInForm(
    profile,
    profileExtras.currentWeightKg,
    profileExtras.useLbsForWeight,
  );

  const handleSave = async () => {
    if (!form.canSave || logMutation.isPending) {
      return;
    }
    setSaveError(null);
    try {
      const result = await logMutation.mutateAsync({
        profile,
        profileExtras,
        newWeightKg: form.weightKg,
        date: form.selectedDateValue,
      });
      onSaved?.(result);
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : copy('progress.weighIn.error.saveFailed'),
      );
    }
  };

  const handleRemindTomorrow = () => {
    snoozeWeighInUntilTomorrow(uid);
    onClose();
  };

  return (
    <>
      <div className="flex rounded-lg border border-cs-border p-1">
        <button
          type="button"
          onClick={() => form.setUseLbs(false)}
          className={cn(
            'min-h-11 flex-1 rounded-md text-sm font-medium',
            !form.useLbs
              ? 'bg-cs-primary text-cs-on-primary'
              : 'text-cs-muted',
          )}
        >
          {copy('common.units.kg')}
        </button>
        <button
          type="button"
          onClick={() => form.setUseLbs(true)}
          className={cn(
            'min-h-11 flex-1 rounded-md text-sm font-medium',
            form.useLbs
              ? 'bg-cs-primary text-cs-on-primary'
              : 'text-cs-muted',
          )}
        >
          {copy('common.units.lbs')}
        </button>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">{copy('common.label.weight')}</span>
        <input
          type="number"
          inputMode="decimal"
          min={form.range.min}
          max={form.range.max}
          step={form.step}
          value={form.weightInput}
          onChange={(event) => form.setWeightInput(event.target.value)}
          className="w-full border-0 bg-transparent text-center text-4xl font-semibold tabular-nums text-cs-foreground outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className={cn(typography.csCaption, 'mb-1 block')}>{copy('common.label.date')}</span>
        <input
          type="date"
          max={form.maxDateInput}
          value={form.selectedDate}
          onChange={(event) => form.setDateInputValue(event.target.value)}
          className="w-full rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm text-cs-foreground"
        />
      </label>

      <p className={cn(typography.csCaption, 'mt-4')}>
        {copy('progress.weighIn.targetAdjust', {
          prev: form.previousDailyTarget,
          next: form.previewDailyTarget,
          prevTdee: form.previousTDEE,
          nextTdee: form.previewTDEE,
        })}
      </p>

      {saveError && (
        <p className="mt-3 text-sm text-cs-danger" role="alert">
          {saveError}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <PrimaryButton
          type="button"
          fullWidth
          onClick={() => void handleSave()}
          disabled={!form.canSave || logMutation.isPending}
          className="min-h-11"
        >
          {logMutation.isPending
            ? copy('common.button.saving')
            : copy('progress.weighIn.save')}
        </PrimaryButton>

        <SecondaryButton
          type="button"
          fullWidth
          onClick={handleRemindTomorrow}
          className="min-h-11"
        >
          {copy('progress.weighIn.remindTomorrow')}
        </SecondaryButton>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg py-2 text-sm text-cs-muted hover:bg-cs-muted/10"
        >
          {copy('common.button.cancel')}
        </button>
      </div>
    </>
  );
}

export function WeighInSheet({
  open,
  uid,
  profile,
  profileExtras,
  onClose,
  onSaved,
}: WeighInSheetProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title={copy('progress.weighIn.title')}
    >
      <WeighInSheetForm
        uid={uid}
        profile={profile}
        profileExtras={profileExtras}
        onClose={onClose}
        onSaved={onSaved}
      />
    </AppDialog>
  );
}
