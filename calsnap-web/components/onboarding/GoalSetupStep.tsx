'use client';

import { ACTIVITY_LEVEL_OPTIONS } from '@/lib/onboarding/activity-level-options';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { weightInputHandlers } from '@/lib/utilities/unit-formatters';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';
import { LocalNumberInput } from '@/components/design/LocalNumberInput';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { useMemo } from 'react';

interface GoalSetupStepProps {
  draft: ProfileDraft;
  onUpdate: (update: (draft: ProfileDraft) => void) => void;
}

const inputClassName = formFieldInputClassName;

export function GoalSetupStep({ draft, onUpdate }: GoalSetupStepProps) {
  const goalWeightHandlers = useMemo(
    () => weightInputHandlers(draft.useLbsGoalWeight),
    [draft.useLbsGoalWeight],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <h2 className={typography.csCardTitle}>{copy('onboarding.goal.title')}</h2>
        <p className={`${typography.csCaption} mt-1`}>{copy('onboarding.goal.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={typography.csMacroLabel}>{copy('onboarding.goal.weight')}</span>
          <button
            type="button"
            onClick={() =>
              onUpdate((d) => {
                d.useLbsGoalWeight = !d.useLbsGoalWeight;
              })
            }
            className={`${typography.csCaption} font-medium underline`}
          >
            {draft.useLbsGoalWeight ? copy('common.units.useKg') : copy('common.units.useLbs')}
          </button>
        </div>
        <LocalNumberInput
          key={draft.useLbsGoalWeight ? 'lbs' : 'kg'}
          inputMode="decimal"
          value={draft.goalWeightKg}
          formatDisplay={goalWeightHandlers.formatDisplay}
          commitValue={goalWeightHandlers.commitValue}
          onChange={(display) =>
            onUpdate((d) => {
              d.goalWeightKg = goalWeightHandlers.toKg(display);
            })
          }
          className={inputClassName}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={typography.csMacroLabel}>{copy('common.label.activityLevel')}</legend>
        <div className="flex flex-col gap-2">
          {ACTIVITY_LEVEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex min-w-0 cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm',
                draft.activityLevel === option.value
                  ? 'border-cs-primary bg-cs-primary/10'
                  : 'border-cs-border',
              )}
            >
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="activityLevel"
                  checked={draft.activityLevel === option.value}
                  onChange={() =>
                    onUpdate((d) => {
                      d.activityLevel = option.value;
                    })
                  }
                />
                {option.label}
              </span>
              <span className={cn(typography.csCaption, 'ml-6 break-words')}>{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
