'use client';

import { useMemo } from 'react';
import { formFieldInputClassName } from '@/lib/design/form-field';
import {
  displayWeight,
  kgFromDisplayWeight,
  weightDisplayRange,
  weightDisplayStep,
} from '@/lib/utilities/unit-formatters';

interface WeightSelectorProps {
  valueKg: number;
  useLbs: boolean;
  onChange: (kg: number) => void;
}

function wholeOptions(useLbs: boolean): number[] {
  const { min, max } = weightDisplayRange(useLbs);
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function WeightSelector({ valueKg, useLbs, onChange }: WeightSelectorProps) {
  const step = weightDisplayStep();
  const displayValue = displayWeight(valueKg, useLbs);
  const whole = Math.floor(displayValue);
  const fractionalStep = Math.min(
    Math.round((displayValue - whole) / step),
    Math.round(1 / step) - 1,
  );

  const wholeOpts = useMemo(() => wholeOptions(useLbs), [useLbs]);

  const commit = (newWhole: number, newTenths: number) => {
    const display = newWhole + newTenths * step;
    onChange(kgFromDisplayWeight(display, useLbs));
  };

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3">
      <select
        value={String(whole)}
        onChange={(e) => commit(Number(e.target.value), fractionalStep)}
        className={formFieldInputClassName}
      >
        {wholeOpts.map((w) => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>
      <select
        value={String(fractionalStep)}
        onChange={(e) => commit(whole, Number(e.target.value))}
        className={formFieldInputClassName}
      >
        {Array.from({ length: Math.round(1 / step) }, (_, i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
    </div>
  );
}
