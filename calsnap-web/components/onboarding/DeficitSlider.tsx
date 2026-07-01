'use client';

import { SecondaryButton } from '@/components/design/PrimaryButton';
import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface DeficitSliderProps {
  deficit: number;
  hardDeficitUnlocked: boolean;
  showHardDeficitAlert: boolean;
  onDeficitChange: (value: number) => void;
  onUnlockHardDeficit: () => void;
  onDismissHardDeficitAlert: () => void;
}

export function DeficitSlider({
  deficit,
  hardDeficitUnlocked,
  showHardDeficitAlert,
  onDeficitChange,
  onUnlockHardDeficit,
  onDismissHardDeficitAlert,
}: DeficitSliderProps) {
  return (
    <>
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
          max={
            hardDeficitUnlocked
              ? AppConstants.Deficit.hardMaxDeficitKcal
              : AppConstants.Deficit.maxDeficitKcal
          }
          step={25}
          value={deficit}
          onChange={(event) => onDeficitChange(Number(event.target.value))}
          className="box-border w-full min-w-0 max-w-full"
        />
        <span className={typography.csCaption}>
          {copy('onboarding.calorie.recommended', {
            min: AppConstants.Deficit.minDeficitKcal,
            max: AppConstants.Deficit.maxDeficitKcal,
          })}
        </span>
      </label>

      {showHardDeficitAlert && (
        <div className="rounded-lg border border-cs-warning/40 bg-cs-warning/10 p-4 text-sm">
          <p className="font-medium text-cs-foreground">
            {copy('onboarding.calorie.hardDeficit.title')}
          </p>
          <p className={`${typography.csCaption} mt-1`}>
            {copy('onboarding.calorie.hardDeficit.body', {
              max: AppConstants.Deficit.maxDeficitKcal,
            })}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onUnlockHardDeficit}
              className="rounded-lg bg-cs-warning px-3 py-1.5 text-xs font-medium text-cs-foreground"
            >
              {copy('onboarding.calorie.hardDeficit.continue')}
            </button>
            <SecondaryButton
              type="button"
              onClick={onDismissHardDeficitAlert}
              className="px-3 py-1.5 text-xs"
            >
              {copy('common.button.cancel')}
            </SecondaryButton>
          </div>
        </div>
      )}
    </>
  );
}
