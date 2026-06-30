'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
  onFocus,
  className,
  ...rest
}: LocalNumberInputProps) {
  const committedDisplay = formatDisplay(value);
  const [draftValue, setDraftValue] = useState(committedDisplay);
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = isFocused ? draftValue : committedDisplay;

  const commit = useCallback(
    (raw: string) => {
      const parsed = parseInput(raw);
      if (parsed === null) {
        setDraftValue(formatDisplay(value));
        return;
      }
      const next = commitValue ? commitValue(parsed) : parsed;
      onChange(next);
      // When commitValue is used, `next` is already in display units (e.g. lbs), not `value` units.
      setDraftValue(commitValue ? String(next) : formatDisplay(next));
    },
    [commitValue, formatDisplay, onChange, parseInput, value],
  );

  const isFocusedRef = useRef(isFocused);
  const draftValueRef = useRef(draftValue);
  const commitRef = useRef(commit);

  // Layout effect keeps refs aligned before passive unmount cleanup runs.
  useLayoutEffect(() => {
    isFocusedRef.current = isFocused;
    draftValueRef.current = draftValue;
    commitRef.current = commit;
  }, [isFocused, draftValue, commit]);

  // Step transitions and navigation can unmount the field before blur fires.
  useEffect(() => {
    return () => {
      if (isFocusedRef.current) {
        commitRef.current(draftValueRef.current);
      }
    };
  }, []);

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={displayValue}
      onFocus={(event) => {
        setDraftValue(committedDisplay);
        draftValueRef.current = committedDisplay;
        isFocusedRef.current = true;
        setIsFocused(true);
        onFocus?.(event);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        setDraftValue(raw);
        draftValueRef.current = raw;
        const parsed = parseInput(raw);
        if (parsed !== null) {
          onChange(parsed);
        }
      }}
      onBlur={(event) => {
        isFocusedRef.current = false;
        setIsFocused(false);
        commit(event.target.value);
        onBlur?.(event);
      }}
      className={cn('box-border w-full min-w-0', className)}
      {...rest}
    />
  );
}

export const parseIntegerInputValue = parseIntegerInput;
