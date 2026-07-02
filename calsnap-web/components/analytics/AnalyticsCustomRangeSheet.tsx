'use client';

import { useState } from 'react';
import { AppDialog } from '@/components/design/AppDialog';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import {
  dateFromLocalDateInput,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';
import { cn } from '@/lib/utils/cn';

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
    <>
      <div className="flex flex-col gap-4">
        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('analytics.customRange.startDate')}
          <input
            type="date"
            value={startValue}
            onChange={(event) => setStartValue(event.target.value)}
            className={cn(formFieldInputClassName, 'min-h-11')}
          />
        </label>
        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('analytics.customRange.endDate')}
          <input
            type="date"
            value={endValue}
            onChange={(event) => setEndValue(event.target.value)}
            className={cn(formFieldInputClassName, 'min-h-11')}
          />
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <SecondaryButton type="button" onClick={onClose} className="min-h-11 flex-1">
          {copy('common.button.cancel')}
        </SecondaryButton>
        <PrimaryButton type="button" onClick={handleApply} className="min-h-11 flex-1">
          {copy('analytics.customRange.apply')}
        </PrimaryButton>
      </div>
    </>
  );
}

export function AnalyticsCustomRangeSheet({
  open,
  initialStart,
  initialEnd,
  onApply,
  onClose,
}: AnalyticsCustomRangeSheetProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title={copy('analytics.customRange.title')}
      description={copy('analytics.customRange.hint')}
    >
      <AnalyticsCustomRangeSheetForm
        key={`${initialStart.getTime()}-${initialEnd.getTime()}`}
        initialStart={initialStart}
        initialEnd={initialEnd}
        onApply={onApply}
        onClose={onClose}
      />
    </AppDialog>
  );
}
