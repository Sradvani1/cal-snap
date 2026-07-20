'use client';

import {
  LocalNumberInput,
  parseIntegerInputValue,
} from '@/components/design/LocalNumberInput';
import { formFieldInputClassName, formFieldFocusRingClassName } from '@/lib/design/form-field';
import {
  clampFeet,
  clampInches,
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

export function HeightInputFields({
  heightCm,
  useImperialHeight,
  onHeightCmChange,
  onToggleImperial,
  inputClassName = formFieldInputClassName,
}: HeightInputFieldsProps) {
  const { feet, inches } = cmToFeetInches(heightCm);

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
            <LocalNumberInput
              inputMode="numeric"
              value={feet}
              parseInput={parseIntegerInputValue}
              commitValue={clampFeet}
              onChange={(nextFeet) => {
                const { inches: currentInches } = cmToFeetInches(heightCm);
                onHeightCmChange(feetInchesToCm(nextFeet, currentInches));
              }}
              className={inputClassName}
            />
          </label>
          <label className={cn(typography.csCaption, 'flex min-w-0 flex-col gap-1')}>
            {copy('common.label.inches')}
            <LocalNumberInput
              inputMode="numeric"
              value={inches}
              parseInput={parseIntegerInputValue}
              commitValue={clampInches}
              onChange={(nextInches) => {
                const { feet: currentFeet } = cmToFeetInches(heightCm);
                onHeightCmChange(feetInchesToCm(currentFeet, nextInches));
              }}
              className={inputClassName}
            />
          </label>
        </div>
      ) : (
        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('common.label.height')} ({copy('common.units.cm')})
          <LocalNumberInput
            key="metric"
            inputMode="numeric"
            value={Math.round(heightCm)}
            commitValue={(value) => Math.min(230, Math.max(120, Math.round(value)))}
            onChange={onHeightCmChange}
            className={inputClassName}
          />
        </label>
      )}
    </div>
  );
}
