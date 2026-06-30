'use client';

import {
  useCallback,
  useEffect,
  useState,
  type InputHTMLAttributes,
} from 'react';
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
  ...rest
}: LocalDateInputProps) {
  const [inputValue, setInputValue] = useState(() => toLocalDateInputValue(value));

  useEffect(() => {
    const fromValue = toLocalDateInputValue(value);
    setInputValue((current) => (current === fromValue ? current : fromValue));
  }, [value.getFullYear(), value.getMonth(), value.getDate()]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setInputValue(next);
      if (isCompleteDateInputValue(next)) {
        onChange(dateFromLocalDateInput(next));
      }
    },
    [onChange],
  );

  return (
    <input
      type="date"
      value={inputValue}
      min={min}
      max={max}
      onChange={handleChange}
      className={cn('box-border w-full min-w-0', className)}
      {...rest}
    />
  );
}
