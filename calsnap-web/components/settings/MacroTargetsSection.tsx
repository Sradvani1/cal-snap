'use client';

import type { MacroKind } from '@/lib/services/profile-update-service';
import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';

interface MacroTargetsSectionProps {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  macroSum: number;
  onAdjust: (kind: MacroKind, value: number) => void;
}

export function MacroTargetsSection({
  proteinPct,
  carbsPct,
  fatPct,
  macroSum,
  onAdjust,
}: MacroTargetsSectionProps) {
  const sumValid = macroSum === 100;

  return (
    <SettingsSectionCard title="Macro targets">
      <div className="flex flex-col gap-4">
        <MacroSlider
          label="Protein"
          value={proteinPct}
          onChange={(value) => onAdjust('protein', value)}
        />
        <MacroSlider
          label="Carbs"
          value={carbsPct}
          onChange={(value) => onAdjust('carbs', value)}
        />
        <MacroSlider
          label="Fat"
          value={fatPct}
          onChange={(value) => onAdjust('fat', value)}
        />
        <p className={`text-sm ${sumValid ? 'text-neutral-600' : 'text-red-600'}`}>
          Total: {macroSum}% {sumValid ? '' : '(must equal 100%)'}
        </p>
      </div>
    </SettingsSectionCard>
  );
}

function MacroSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between font-medium text-neutral-700">
        <span>{label}</span>
        <span>{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  );
}
