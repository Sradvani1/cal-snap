'use client';

import { useMemo } from 'react';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { cn } from '@/lib/utils/cn';

interface WeightSelectorProps {
  valueKg: number;
  useLbs: boolean;
  onChange: (kg: number) => void;
}

const LBS_PER_KG = 2.2046226218;

function wholeOptions(useLbs: boolean): number[] {
  const min = useLbs ? 100 : 45;
  const max = useLbs ? 200 : 91;
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function WeightSelector({ valueKg, useLbs, onChange }: WeightSelectorProps) {
  const displayValue = useLbs ? valueKg * LBS_PER_KG : valueKg;
  const min = useLbs ? 100 : 45;
  const max = useLbs ? 200 : 91;
  const clamped = Math.min(Math.max(displayValue, min), max);
  const whole = Math.floor(clamped);
  const tenths = Math.round((clamped - whole) * 10);

  const wholeOpts = useMemo(() => wholeOptions(useLbs), [useLbs]);

  const commit = (newWhole: number, newTenths: number) => {
    onChange(useLbs ? (newWhole + newTenths / 10) / LBS_PER_KG : newWhole + newTenths / 10);
  };

  return (
    <div className="flex items-start gap-1">
      <select
        value={String(whole)}
        onChange={(e) => commit(Number(e.target.value), tenths)}
        className={cn(formFieldInputClassName, 'flex-1')}
      >
        {wholeOpts.map((w) => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>
      <span className="mt-2 text-sm text-cs-muted">.</span>
      <select
        value={String(tenths)}
        onChange={(e) => commit(whole, Number(e.target.value))}
        className={cn(formFieldInputClassName, 'w-20')}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
    </div>
  );
}
