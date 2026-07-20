'use client';

import { formFieldInputClassName, formFieldFocusRingClassName } from '@/lib/design/form-field';
import {
  cmToFeetInches,
  feetInchesToCm,
} from '@/lib/utilities/unit-formatters';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface HeightInputFieldsProps {
  heightCm: number;
  useImperialHeight: boolean;
  onHeightCmChange: (heightCm: number) => void;
  onToggleImperial?: () => void;
  inputClassName?: string;
}

const CM_OPTIONS = Array.from({ length: 230 - 120 + 1 }, (_, i) => 120 + i);
const FT_OPTIONS = [4, 5, 6];
const IN_OPTIONS = Array.from({ length: 12 }, (_, i) => i);

export function HeightInputFields({
  heightCm,
  useImperialHeight,
  onHeightCmChange,
  onToggleImperial,
  inputClassName = formFieldInputClassName,
}: HeightInputFieldsProps) {
  const raw = cmToFeetInches(heightCm);
  const feet = Math.min(Math.max(raw.feet, 4), 6);
  const inches = raw.feet < 4 ? 0 : raw.feet > 6 ? 11 : raw.inches;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        {useImperialHeight ? (
          <span className={typography.csMacroLabel}>{copy('common.label.height')}</span>
        ) : null}
        {onToggleImperial && (
          <button
            type="button"
            onClick={onToggleImperial}
            className={cn(
              typography.csCaption,
              'shrink-0 font-medium underline',
              formFieldFocusRingClassName,
            )}
          >
            {useImperialHeight ? copy('common.units.useCm') : copy('common.units.useFtIn')}
          </button>
        )}
      </div>
      {useImperialHeight ? (
        <div key="imperial" className="grid min-w-0 grid-cols-2 gap-3">
          <label className={cn(typography.csCaption, 'flex min-w-0 flex-col gap-1')}>
            {copy('common.label.feet')}
            <select
              value={String(feet)}
              onChange={(e) => {
                const nextFeet = Number(e.target.value);
                onHeightCmChange(feetInchesToCm(nextFeet, inches));
              }}
              className={inputClassName}
            >
              {FT_OPTIONS.map((ft) => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
          </label>
          <label className={cn(typography.csCaption, 'flex min-w-0 flex-col gap-1')}>
            {copy('common.label.inches')}
            <select
              value={String(inches)}
              onChange={(e) => {
                const nextInches = Number(e.target.value);
                onHeightCmChange(feetInchesToCm(feet, nextInches));
              }}
              className={inputClassName}
            >
              {IN_OPTIONS.map((inch) => (
                <option key={inch} value={inch}>{inch}</option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('common.label.height')} ({copy('common.units.cm')})
          <select
            key="metric"
            value={String(Math.round(heightCm))}
            onChange={(e) => onHeightCmChange(Number(e.target.value))}
            className={inputClassName}
          >
            {CM_OPTIONS.map((cm) => (
              <option key={cm} value={cm}>{cm}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
