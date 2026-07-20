'use client';

import { useCallback, useRef } from 'react';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
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
  const nativeRef = useRef<HTMLInputElement>(null);

  const toLocalDateValue = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
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
          disabled={today}
          onClick={() => onDateChange(nextDay(date))}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            today ? 'text-cs-muted/30' : 'text-cs-foreground',
            formFieldFocusRingClassName,
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <input
          ref={nativeRef}
          type="date"
          value={toLocalDateValue(date)}
          max={toLocalDateValue(new Date())}
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
