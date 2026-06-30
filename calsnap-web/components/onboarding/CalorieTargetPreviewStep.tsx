'use client';

import { SecondaryButton } from '@/components/design/PrimaryButton';
import { AppConstants } from '@/lib/constants';
import type { OnboardingTargets } from '@/lib/onboarding/use-onboarding';
import { formatMacroGrams } from '@/lib/utilities/unit-formatters';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface CalorieTargetPreviewStepProps {
  targets: OnboardingTargets;
  deficit: number;
  hardDeficitUnlocked: boolean;
  showHardDeficitAlert: boolean;
  onDeficitChange: (value: number) => void;
  onUnlockHardDeficit: () => void;
  onDismissHardDeficitAlert: () => void;
}

export function CalorieTargetPreviewStep({
  targets,
  deficit,
  hardDeficitUnlocked,
  showHardDeficitAlert,
  onDeficitChange,
  onUnlockHardDeficit,
  onDismissHardDeficitAlert,
}: CalorieTargetPreviewStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className={typography.csCardTitle}>{copy('onboarding.calorie.title')}</h2>
        <p className={`${typography.csCaption} mt-1`}>{copy('onboarding.calorie.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-cs-muted/10 p-4 text-sm">
        <div>
          <p className={typography.csCaption}>{copy('common.macro.tdee')}</p>
          <p className={typography.csCardTitle}>
            {targets.tdee} {copy('common.macro.kcal')}
          </p>
        </div>
        <div>
          <p className={typography.csCaption}>{copy('common.macro.dailyTarget')}</p>
          <p className={typography.csCardTitle}>
            {targets.target} {copy('common.macro.kcal')}
          </p>
        </div>
      </div>

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

      {targets.warnings.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-cs-warning">
          {targets.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-cs-border p-4 text-sm">
        <p className={typography.csMacroLabel}>{copy('onboarding.calorie.macroTargets')}</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className={typography.csCaption}>{copy('common.macro.protein')}</p>
            <p className="font-semibold">{formatMacroGrams(targets.proteinG, 0)}</p>
          </div>
          <div>
            <p className={typography.csCaption}>{copy('common.macro.carbs')}</p>
            <p className="font-semibold">{formatMacroGrams(targets.carbsG, 0)}</p>
          </div>
          <div>
            <p className={typography.csCaption}>{copy('common.macro.fat')}</p>
            <p className="font-semibold">{formatMacroGrams(targets.fatG, 0)}</p>
          </div>
        </div>
        <p className={`${typography.csCaption} mt-3`}>
          {copy('onboarding.calorie.macroDefaultsNote')}
        </p>
      </div>

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
    </div>
  );
}
