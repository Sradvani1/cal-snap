'use client';

import { useState } from 'react';
import {
  dateFromLocalDateInput,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';

interface AnalyticsCustomRangeSheetProps {
  open: boolean;
  initialStart: Date;
  initialEnd: Date;
  onApply: (start: Date, end: Date) => void;
  onClose: () => void;
}

function AnalyticsCustomRangeSheetForm({
  initialStart,
  initialEnd,
  onApply,
  onClose,
}: Omit<AnalyticsCustomRangeSheetProps, 'open'>) {
  const [startValue, setStartValue] = useState(() => toLocalDateInputValue(initialStart));
  const [endValue, setEndValue] = useState(() => toLocalDateInputValue(initialEnd));

  const handleApply = () => {
    onApply(dateFromLocalDateInput(startValue), dateFromLocalDateInput(endValue));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-range-title"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-xl">
        <h2 id="custom-range-title" className="text-lg font-semibold text-neutral-900">
          Custom range
        </h2>
        <p className="mt-1 text-sm text-neutral-600">Select up to 365 days.</p>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            Start date
            <input
              type="date"
              value={startValue}
              onChange={(event) => setStartValue(event.target.value)}
              className="min-h-11 rounded-lg border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            End date
            <input
              type="date"
              value={endValue}
              onChange={(event) => setEndValue(event.target.value)}
              className="min-h-11 rounded-lg border border-neutral-200 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="min-h-11 flex-1 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsCustomRangeSheet({
  open,
  initialStart,
  initialEnd,
  onApply,
  onClose,
}: AnalyticsCustomRangeSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <AnalyticsCustomRangeSheetForm
      key={`${initialStart.getTime()}-${initialEnd.getTime()}`}
      initialStart={initialStart}
      initialEnd={initialEnd}
      onApply={onApply}
      onClose={onClose}
    />
  );
}
