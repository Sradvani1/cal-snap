'use client';

import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface DeficitSliderProps {
  deficit: number;
  onDeficitChange: (value: number) => void;
}

export function DeficitSlider({
  deficit,
  onDeficitChange,
}: DeficitSliderProps) {
  return (
    <label className={cn(typography.csMacroLabel, 'flex flex-col gap-2')}>
      <div className="flex items-center justify-between">
        <span>{copy('onboarding.calorie.deficit')}</span>
        <span className="font-semibold">
          {deficit} {copy('common.macro.kcal')}
        </span>
      </div>
      <input
        type="range"
        min={AppConstants.Deficit.minDeficitKcal}
        max={AppConstants.Deficit.maxDeficitKcal}
        step={25}
        value={deficit}
        onChange={(event) => onDeficitChange(Number(event.target.value))}
        className={cn('box-border w-full min-w-0 max-w-full', formFieldFocusRingClassName)}
      />
      <span className={typography.csCaption}>
        {copy('onboarding.calorie.recommended', {
          min: AppConstants.Deficit.minDeficitKcal,
          max: AppConstants.Deficit.maxDeficitKcal,
        })}
      </span>
    </label>
  );
}
