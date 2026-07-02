'use client';

import { useCallback, useRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  dateFromLocalDateInput,
  isCompleteDateInputValue,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';

export interface LocalDateInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'defaultValue' | 'onChange' | 'readOnly'
  > {
  value: Date;
  onChange: (date: Date) => void;
}

function openNativeDatePicker(nativeInput: HTMLInputElement | null): void {
  if (!nativeInput) {
    return;
  }
  nativeInput.focus({ preventScroll: true });
  if (typeof nativeInput.showPicker === 'function') {
    try {
      nativeInput.showPicker();
    } catch {
      // showPicker can throw when not allowed; focus may still open the picker on iOS.
    }
  }
}

/**
 * Date field styled like other text inputs. Safari gives `type="date"` a fixed
 * minimum width that CSS cannot shrink, so the visible control is a read-only
 * text input; a clipped native date input supplies the system picker.
 */
export function LocalDateInput({
  value,
  onChange,
  className,
  min,
  max,
  onFocus,
  onBlur,
  onClick,
  ...rest
}: LocalDateInputProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const displayValue = toLocalDateInputValue(value);

  const handleNativeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      if (isCompleteDateInputValue(next)) {
        onChange(dateFromLocalDateInput(next));
      }
    },
    [onChange],
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      openNativeDatePicker(nativeRef.current);
      onFocus?.(event);
    },
    [onFocus],
  );

  return (
    <div className="w-full min-w-0">
      <input
        type="text"
        readOnly
        value={displayValue}
        onFocus={handleFocus}
        onClick={onClick}
        onBlur={onBlur}
        className={cn('cursor-pointer', className)}
        autoComplete="bday"
        {...rest}
      />
      <input
        ref={nativeRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={displayValue}
        min={min}
        max={max}
        onChange={handleNativeChange}
        className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
      />
    </div>
  );
}
