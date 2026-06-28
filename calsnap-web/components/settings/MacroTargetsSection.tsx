'use client';

import { SectionCard } from '@/components/design/SectionCard';
import type { MacroKind } from '@/lib/services/profile-update-service';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

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
    <SectionCard title={copy('settings.section.macroTargets')}>
      <div className="flex flex-col gap-4">
        <MacroSlider
          label={copy('common.macro.protein')}
          value={proteinPct}
          onChange={(value) => onAdjust('protein', value)}
        />
        <MacroSlider
          label={copy('common.macro.carbs')}
          value={carbsPct}
          onChange={(value) => onAdjust('carbs', value)}
        />
        <MacroSlider
          label={copy('common.macro.fat')}
          value={fatPct}
          onChange={(value) => onAdjust('fat', value)}
        />
        <p className={cn('text-sm', sumValid ? typography.csCaption : 'text-cs-danger')}>
          {copy('settings.macro.total', { sum: macroSum })}{' '}
          {sumValid ? '' : copy('settings.macro.mustEqual100')}
        </p>
      </div>
    </SectionCard>
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
    <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
      <span className="flex justify-between">
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
