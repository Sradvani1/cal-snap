'use client';

import { useEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';
import {
  extendItemWeightRange,
  initialItemWeightRange,
  type ItemWeightRange,
} from '@/lib/nutrition/item-weight-range';

const ENDPOINT_HOLD_MS = 400;

interface ExtensibleWeightSliderProps {
  originalWeightG: number;
  value: number;
  onChange: (weightG: number) => void;
  className: string;
  ariaLabel: string;
}

export function ExtensibleWeightSlider({
  originalWeightG,
  value,
  onChange,
  className,
  ariaLabel,
}: ExtensibleWeightSliderProps) {
  const [range, setRange] = useState<ItemWeightRange>(() => initialItemWeightRange(originalWeightG));
  const [rangeAnnouncement, setRangeAnnouncement] = useState('');
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerActiveRef = useRef(false);
  const extendedForPointerRef = useRef(false);

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const extendRange = (direction: 'lower' | 'higher'): boolean => {
    const nextRange = extendItemWeightRange(range, originalWeightG, direction);
    if (nextRange === range) {
      return false;
    }
    setRange(nextRange);
    setRangeAnnouncement(
      copy('common.weight.rangeExtended', { min: nextRange.min, max: nextRange.max }),
    );
    return true;
  };

  const scheduleExtension = (direction: 'lower' | 'higher') => {
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      if (!pointerActiveRef.current || extendedForPointerRef.current) {
        return;
      }
      extendedForPointerRef.current = extendRange(direction);
    }, ENDPOINT_HOLD_MS);
  };

  const finishPointerInteraction = () => {
    pointerActiveRef.current = false;
    extendedForPointerRef.current = false;
    clearHoldTimer();
  };

  const handleValueChange = (nextValue: number) => {
    // A native range input remaps its thumb after expansion. Ignore its remaining
    // events until release so it cannot overwrite the value being held at the edge.
    if (pointerActiveRef.current && extendedForPointerRef.current) {
      return;
    }

    onChange(nextValue);
    if (!pointerActiveRef.current || extendedForPointerRef.current) {
      return;
    }
    if (nextValue === range.min) {
      scheduleExtension('lower');
    } else if (nextValue === range.max) {
      scheduleExtension('higher');
    } else {
      clearHoldTimer();
    }
  };

  return (
    <>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={1}
        value={value}
        onPointerDown={() => {
          pointerActiveRef.current = true;
          extendedForPointerRef.current = false;
          if (value === range.min) {
            scheduleExtension('lower');
          } else if (value === range.max) {
            scheduleExtension('higher');
          }
        }}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={finishPointerInteraction}
        onLostPointerCapture={finishPointerInteraction}
        onBlur={finishPointerInteraction}
        onChange={(event) => handleValueChange(Number(event.target.value))}
        onKeyDown={(event) => {
          const direction =
            event.key === 'ArrowLeft' || event.key === 'ArrowDown'
              ? 'lower'
              : event.key === 'ArrowRight' || event.key === 'ArrowUp'
                ? 'higher'
                : null;
          if (
            direction !== null &&
            ((direction === 'lower' && value === range.min) ||
              (direction === 'higher' && value === range.max))
          ) {
            event.preventDefault();
            extendRange(direction);
          }
        }}
        className={className}
        aria-label={ariaLabel}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {rangeAnnouncement}
      </span>
    </>
  );
}
