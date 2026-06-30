'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils/cn';

export interface LocalNumberInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'defaultValue' | 'onChange' | 'type'
  > {
  value: number;
  onChange: (value: number) => void;
  formatDisplay?: (value: number) => string;
  parseInput?: (input: string) => number | null;
  commitValue?: (value: number) => number;
  inputMode?: 'numeric' | 'decimal';
}

const defaultFormatDisplay = (value: number) => String(value);

const defaultParseInput = (input: string): number | null => {
  if (input.trim() === '') {
    return null;
  }
  const parsed = Number.parseFloat(input);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseIntegerInput = (input: string): number | null => {
  if (input.trim() === '') {
    return null;
  }
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Number input that keeps a local string value while editing so multi-digit
 * values can be typed without the controlled value snapping mid-edit.
 */
export function LocalNumberInput({
  value,
  onChange,
  formatDisplay = defaultFormatDisplay,
  parseInput = defaultParseInput,
  commitValue,
  inputMode = 'decimal',
  onBlur,
  className,
  ...rest
}: LocalNumberInputProps) {
  const [inputValue, setInputValue] = useState(() => formatDisplay(value));
  const focusedRef = useRef(false);
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  useEffect(() => {
    if (focusedRef.current) {
      return;
    }
    const formatted = formatDisplay(value);
    setInputValue((current) => (current === formatted ? current : formatted));
  }, [value, formatDisplay]);

  const commit = useCallback(
    (raw: string) => {
      const parsed = parseInput(raw);
      if (parsed === null) {
        setInputValue(formatDisplay(value));
        return;
      }
      const next = commitValue ? commitValue(parsed) : parsed;
      onChange(next);
      // When commitValue is used, `next` is already in display units (e.g. lbs), not `value` units.
      setInputValue(commitValue ? String(next) : formatDisplay(next));
    },
    [commitValue, formatDisplay, onChange, parseInput, value],
  );

  const commitRef = useRef(commit);
  commitRef.current = commit;

  // Step transitions and navigation can unmount the field before blur fires.
  useEffect(() => {
    return () => {
      if (focusedRef.current) {
        commitRef.current(inputValueRef.current);
      }
    };
  }, []);

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={inputValue}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(event) => {
        const raw = event.target.value;
        setInputValue(raw);
        const parsed = parseInput(raw);
        if (parsed !== null) {
          onChange(parsed);
        }
      }}
      onBlur={(event) => {
        focusedRef.current = false;
        commit(event.target.value);
        onBlur?.(event);
      }}
      className={cn('box-border w-full min-w-0', className)}
      {...rest}
    />
  );
}

export const parseIntegerInputValue = parseIntegerInput;
