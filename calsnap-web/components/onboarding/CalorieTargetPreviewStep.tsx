'use client';

import { DeficitSlider } from '@/components/onboarding/DeficitSlider';
import type { OnboardingTargets } from '@/lib/onboarding/use-onboarding';
import { formatEstimatedGoalDate } from '@/lib/nutrition/goal-pathway';
import { formatMacroGrams } from '@/lib/utilities/unit-formatters';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

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
  const estimatedGoalDateLabel = formatEstimatedGoalDate(
    targets.goalTargetDate,
    targets.deficit,
  );

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
        <div className="col-span-2">
          <p className={typography.csCaption}>{copy('onboarding.calorie.estimatedGoalDate')}</p>
          <p className={typography.csCardTitle}>{estimatedGoalDateLabel}</p>
        </div>
      </div>

      <DeficitSlider
        deficit={deficit}
        hardDeficitUnlocked={hardDeficitUnlocked}
        showHardDeficitAlert={showHardDeficitAlert}
        onDeficitChange={onDeficitChange}
        onUnlockHardDeficit={onUnlockHardDeficit}
        onDismissHardDeficitAlert={onDismissHardDeficitAlert}
      />

      {targets.warnings.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-cs-warning">
          {targets.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-cs-border p-4 text-sm">
        <p className={typography.csMacroLabel}>{copy('onboarding.calorie.macroTargets')}</p>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
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
          <div>
            <p className={typography.csCaption}>{copy('common.macro.fiber')}</p>
            <p className="font-semibold">{formatMacroGrams(targets.fiberG, 0)}</p>
          </div>
        </div>
        <p className={`${typography.csCaption} mt-3`}>
          {copy('onboarding.calorie.macroDefaultsNote')}
        </p>
      </div>
    </div>
  );
}
