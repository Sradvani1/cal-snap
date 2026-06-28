'use client';

import { ACTIVITY_LEVEL_OPTIONS } from '@/lib/onboarding/activity-level-options';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import {
  dateFromLocalDateInput,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';
import {
  displayWeight,
  kgFromDisplayWeight,
  snappedDisplayWeight,
} from '@/lib/utilities/unit-formatters';

interface GoalSetupStepProps {
  draft: ProfileDraft;
  onUpdate: (update: (draft: ProfileDraft) => void) => void;
}

export function GoalSetupStep({ draft, onUpdate }: GoalSetupStepProps) {
  const displayGoalWeight = displayWeight(draft.goalWeightKg, draft.useLbsGoalWeight);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Your goal</h2>
        <p className="mt-1 text-sm text-neutral-600">Where do you want to be?</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">Goal weight</span>
          <button
            type="button"
            onClick={() =>
              onUpdate((d) => {
                d.useLbsGoalWeight = !d.useLbsGoalWeight;
              })
            }
            className="text-xs font-medium text-neutral-600 underline"
          >
            {draft.useLbsGoalWeight ? 'Use kg' : 'Use lbs'}
          </button>
        </div>
        <input
          type="number"
          step={draft.useLbsGoalWeight ? 1 : 0.5}
          value={displayGoalWeight}
          onChange={(event) =>
            onUpdate((d) => {
              const snapped = snappedDisplayWeight(
                Number(event.target.value),
                d.useLbsGoalWeight,
              );
              d.goalWeightKg = kgFromDisplayWeight(snapped, d.useLbsGoalWeight);
            })
          }
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Target date</span>
        <input
          type="date"
          value={toLocalDateInputValue(draft.goalTargetDate)}
          onChange={(event) =>
            onUpdate((d) => {
              d.goalTargetDate = dateFromLocalDateInput(event.target.value);
            })
          }
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <span className="text-xs text-neutral-500">At least 2 weeks from today</span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-neutral-700">Activity level</legend>
        <div className="flex flex-col gap-2">
          {ACTIVITY_LEVEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm ${
                draft.activityLevel === option.value
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
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
              <span className="ml-6 text-neutral-500">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
