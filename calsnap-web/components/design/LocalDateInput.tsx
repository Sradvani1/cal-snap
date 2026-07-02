'use client';

import { useCallback, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  dateFromLocalDateInput,
  isCompleteDateInputValue,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';

export interface LocalDateInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'defaultValue' | 'onChange'
  > {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * Date input that keeps a local string value while editing so year/month/day
 * fields can be changed without the controlled input snapping back mid-edit.
 */
export function LocalDateInput({
  value,
  onChange,
  className,
  min,
  max,
  onFocus,
  onBlur,
  ...rest
}: LocalDateInputProps) {
  const committedValue = toLocalDateInputValue(value);
  const [draftValue, setDraftValue] = useState(committedValue);
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = isFocused ? draftValue : committedValue;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setDraftValue(next);
      if (isCompleteDateInputValue(next)) {
        onChange(dateFromLocalDateInput(next));
      }
    },
    [onChange],
  );

  return (
    <div className="max-w-full min-w-0 overflow-hidden">
      <input
        type="date"
        value={displayValue}
        min={min}
        max={max}
        onFocus={(event) => {
          setDraftValue(committedValue);
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onChange={handleChange}
        className={cn('box-border w-full min-w-0 max-w-full', className)}
        {...rest}
      />
    </div>
  );
}
