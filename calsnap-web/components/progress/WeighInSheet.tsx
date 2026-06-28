'use client';

import { useState } from 'react';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import { useWeighInForm } from '@/lib/progress/use-weigh-in-form';
import { snoozeWeighInUntilTomorrow } from '@/lib/progress/weigh-in-snooze';
import { useLogWeighIn } from '@/lib/queries/use-log-weigh-in';
import type { SaveWeighInResult } from '@/lib/services/weigh-in-service';

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
      setSaveError(err instanceof Error ? err.message : 'Failed to save weigh-in');
    }
  };

  const handleRemindTomorrow = () => {
    snoozeWeighInUntilTomorrow(uid);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weigh-in-title"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-xl">
        <h2 id="weigh-in-title" className="text-lg font-semibold text-neutral-900">
          Log weigh-in
        </h2>

        <div className="mt-4 flex rounded-lg border border-neutral-200 p-1">
          <button
            type="button"
            onClick={() => form.setUseLbs(false)}
            className={`min-h-11 flex-1 rounded-md text-sm font-medium ${
              !form.useLbs ? 'bg-neutral-900 text-white' : 'text-neutral-600'
            }`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => form.setUseLbs(true)}
            className={`min-h-11 flex-1 rounded-md text-sm font-medium ${
              form.useLbs ? 'bg-neutral-900 text-white' : 'text-neutral-600'
            }`}
          >
            lbs
          </button>
        </div>

        <label className="mt-4 block">
          <span className="sr-only">Weight</span>
          <input
            type="number"
            inputMode="decimal"
            min={form.range.min}
            max={form.range.max}
            step={form.step}
            value={form.weightInput}
            onChange={(event) => form.setWeightInput(event.target.value)}
            className="w-full border-0 bg-transparent text-center text-4xl font-semibold tabular-nums text-neutral-900 outline-none"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm text-neutral-600">Date</span>
          <input
            type="date"
            max={form.maxDateInput}
            value={form.selectedDate}
            onChange={(event) => form.setDateInputValue(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>

        <p className="mt-4 text-sm text-neutral-600">
          Your target adjusts from{' '}
          <span className="font-medium text-neutral-900">{form.previousDailyTarget}</span> to{' '}
          <span className="font-medium text-neutral-900">{form.previewDailyTarget}</span> kcal/day
          {' '}(TDEE {form.previousTDEE} → {form.previewTDEE})
        </p>

        {saveError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {saveError}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!form.canSave || logMutation.isPending}
            className="min-h-11 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {logMutation.isPending ? 'Saving…' : 'Save weigh-in'}
          </button>

          <button
            type="button"
            onClick={handleRemindTomorrow}
            className="min-h-11 w-full rounded-lg py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Remind me tomorrow
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg py-2 text-sm text-neutral-500 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
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
  if (!open) {
    return null;
  }

  return (
    <WeighInSheetForm
      uid={uid}
      profile={profile}
      profileExtras={profileExtras}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
