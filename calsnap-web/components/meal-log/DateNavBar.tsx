'use client';

import { useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { MAX_FUTURE_LOG_DAYS } from '@/lib/meal-log/log-date';
import { toLocalDateInputValue } from '@/lib/utilities/date-input';
import { cn } from '@/lib/utils/cn';

interface DateNavBarProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isAtMaxDate(date: Date): boolean {
  const limit = new Date();
  limit.setDate(limit.getDate() + MAX_FUTURE_LOG_DAYS);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  limit.setHours(0, 0, 0, 0);
  return d.getTime() >= limit.getTime();
}

function maxDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + MAX_FUTURE_LOG_DAYS);
  return d;
}

function prevDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d;
}

function nextDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DateNavBar({ date, onDateChange }: DateNavBarProps) {
  const today = isToday(date);
  const atMax = isAtMaxDate(date);
  const nativeRef = useRef<HTMLInputElement>(null);

  const handleNativeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [y, m, d] = val.split('-').map(Number);
        onDateChange(new Date(y, m - 1, d, 12, 0, 0));
      }
    },
    [onDateChange],
  );

  const openPicker = useCallback(() => {
    nativeRef.current?.showPicker();
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => onDateChange(prevDay(date))}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg text-cs-foreground',
            formFieldFocusRingClassName,
          )}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={openPicker}
          className={cn(
            typography.csCardTitle,
            'px-2 py-1 rounded-lg hover:bg-cs-muted/10',
            formFieldFocusRingClassName,
          )}
        >
          {formatDate(date)}
        </button>

        <button
          type="button"
          aria-label="Next day"
          disabled={atMax}
          onClick={() => onDateChange(nextDay(date))}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            atMax ? 'text-cs-muted/30' : 'text-cs-foreground',
            formFieldFocusRingClassName,
          )}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>

        <input
          ref={nativeRef}
          type="date"
          value={toLocalDateInputValue(date)}
          max={toLocalDateInputValue(maxDate())}
          onChange={handleNativeChange}
          className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      {!today && (
        <button
          type="button"
          onClick={() => onDateChange(new Date())}
          className={cn(
            'rounded-full bg-cs-primary px-3 py-1 text-sm font-medium text-white',
            formFieldFocusRingClassName,
          )}
        >
          {copy('mealLog.dateNav.today')}
        </button>
      )}
    </div>
  );
}
