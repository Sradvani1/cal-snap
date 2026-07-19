'use client';

import { MacroPresetPicker } from '@/components/design/MacroPresetPicker';
import { SectionCard } from '@/components/design/SectionCard';
import type { MacroPresetKey } from '@/lib/models/macro-preset';
import type { MacroKind } from '@/lib/services/profile-update-service';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface MacroTargetsSectionProps {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  macroSum: number;
  activePreset: MacroPresetKey | null;
  onAdjust: (kind: MacroKind, value: number) => void;
  onApplyPreset: (key: MacroPresetKey) => void;
}

export function MacroTargetsSection({
  proteinPct,
  carbsPct,
  fatPct,
  macroSum,
  activePreset,
  onAdjust,
  onApplyPreset,
}: MacroTargetsSectionProps) {
  const sumValid = macroSum === 100;

  return (
    <SectionCard title={copy('settings.section.macroTargets')}>
      <div className="flex flex-col gap-4">
        <div>
          <p className={cn(typography.csCaption, 'mb-2')}>{copy('settings.macro.preset')}</p>
          <MacroPresetPicker value={activePreset} onChange={onApplyPreset} label={copy('settings.macro.preset')} />
        </div>
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
        <p className={cn('text-sm', sumValid ? typography.csCaption : 'text-cs-danger-text')}>
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
        className={cn('box-border w-full min-w-0 max-w-full', formFieldFocusRingClassName)}
      />
    </label>
  );
}
