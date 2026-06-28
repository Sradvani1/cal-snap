'use client';

import { AppConstants } from '@/lib/constants';
import type { OnboardingTargets } from '@/lib/onboarding/use-onboarding';
import { formatMacroGrams } from '@/lib/utilities/unit-formatters';

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
        <h2 className="text-xl font-semibold text-neutral-900">Your calorie target</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Based on your profile and activity level.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-4 text-sm">
        <div>
          <p className="text-neutral-500">TDEE</p>
          <p className="text-lg font-semibold text-neutral-900">{targets.tdee} kcal</p>
        </div>
        <div>
          <p className="text-neutral-500">Daily target</p>
          <p className="text-lg font-semibold text-neutral-900">{targets.target} kcal</p>
        </div>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-neutral-700">Daily deficit</span>
          <span className="font-semibold text-neutral-900">{deficit} kcal</span>
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
          className="w-full"
        />
        <span className="text-xs text-neutral-500">
          Recommended: {AppConstants.Deficit.minDeficitKcal}–{AppConstants.Deficit.maxDeficitKcal} kcal/day
        </span>
      </label>

      {targets.warnings.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-amber-700">
          {targets.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-neutral-200 p-4 text-sm">
        <p className="font-medium text-neutral-900">Macro targets</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-neutral-500">Protein</p>
            <p className="font-semibold">{formatMacroGrams(targets.proteinG, 0)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Carbs</p>
            <p className="font-semibold">{formatMacroGrams(targets.carbsG, 0)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Fat</p>
            <p className="font-semibold">{formatMacroGrams(targets.fatG, 0)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Macro split follows evidence-based defaults (28% protein, 47% carbs, 25% fat), within ±15% of common recommendations.
        </p>
      </div>

      {showHardDeficitAlert && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-900">High deficit warning</p>
          <p className="mt-1 text-amber-800">
            Deficits above {AppConstants.Deficit.maxDeficitKcal} kcal/day can trigger metabolic adaptation. Continue only if you understand the risks.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onUnlockHardDeficit}
              className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              I understand, continue
            </button>
            <button
              type="button"
              onClick={onDismissHardDeficitAlert}
              className="rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-medium text-amber-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
