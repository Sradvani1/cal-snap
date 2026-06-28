'use client';

import { ACTIVITY_LEVEL_OPTIONS } from '@/lib/onboarding/activity-level-options';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import {
  dateFromLocalDateInput,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';
import {
  cmToFeetInches,
  displayWeight,
  feetInchesToCm,
  kgFromDisplayWeight,
  snappedDisplayWeight,
} from '@/lib/utilities/unit-formatters';
import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';

interface ProfileSectionProps {
  draft: ProfileDraft;
  onUpdateDraft: (update: (draft: ProfileDraft) => void) => void;
  currentWeightKg: number;
  onWeightChange: (kg: number) => void;
  useLbsForWeight: boolean;
  useImperialForHeight: boolean;
  previewTDEE: number;
  previewTarget: number;
  minimumCalories: number;
}

export function ProfileSection({
  draft,
  onUpdateDraft,
  currentWeightKg,
  onWeightChange,
  useLbsForWeight,
  useImperialForHeight,
  previewTDEE,
  previewTarget,
  minimumCalories,
}: ProfileSectionProps) {
  const { feet, inches } = cmToFeetInches(draft.heightCm);
  const displayWeightValue = displayWeight(currentWeightKg, useLbsForWeight);
  const displayGoalWeight = displayWeight(draft.goalWeightKg, draft.useLbsGoalWeight);

  return (
    <SettingsSectionCard title="Profile">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Name (optional)</span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) =>
              onUpdateDraft((d) => {
                d.name = event.target.value;
              })
            }
            className="rounded-lg border border-neutral-300 px-3 py-2"
            placeholder="Your name"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-neutral-700">Sex</legend>
          <div className="flex gap-3">
            {(['male', 'female'] as const).map((sex) => (
              <label key={sex} className="flex items-center gap-2 text-sm capitalize">
                <input
                  type="radio"
                  name="settings-sex"
                  checked={draft.sex === sex}
                  onChange={() =>
                    onUpdateDraft((d) => {
                      d.sex = sex;
                    })
                  }
                />
                {sex}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Date of birth</span>
          <input
            type="date"
            value={toLocalDateInputValue(draft.dateOfBirth)}
            onChange={(event) =>
              onUpdateDraft((d) => {
                d.dateOfBirth = dateFromLocalDateInput(event.target.value);
              })
            }
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-700">Height</span>
          {useImperialForHeight ? (
            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span>Feet</span>
                <input
                  type="number"
                  min={4}
                  max={8}
                  value={feet}
                  onChange={(event) =>
                    onUpdateDraft((d) => {
                      d.heightCm = feetInchesToCm(Number(event.target.value), inches);
                    })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span>Inches</span>
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={inches}
                  onChange={(event) =>
                    onUpdateDraft((d) => {
                      d.heightCm = feetInchesToCm(feet, Number(event.target.value));
                    })
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>
            </div>
          ) : (
            <input
              type="number"
              min={120}
              max={230}
              value={Math.round(draft.heightCm)}
              onChange={(event) =>
                onUpdateDraft((d) => {
                  d.heightCm = Number(event.target.value);
                })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          )}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">
            Current weight ({useLbsForWeight ? 'lbs' : 'kg'})
          </span>
          <input
            type="number"
            step={useLbsForWeight ? 1 : 0.5}
            value={displayWeightValue}
            onChange={(event) => {
              const parsed = Number.parseFloat(event.target.value);
              if (!Number.isFinite(parsed)) {
                return;
              }
              const snapped = snappedDisplayWeight(parsed, useLbsForWeight);
              onWeightChange(kgFromDisplayWeight(snapped, useLbsForWeight));
            }}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
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
                    name="settings-activity"
                    checked={draft.activityLevel === option.value}
                    onChange={() =>
                      onUpdateDraft((d) => {
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

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">
            Goal weight ({draft.useLbsGoalWeight ? 'lbs' : 'kg'})
          </span>
          <input
            type="number"
            step={draft.useLbsGoalWeight ? 1 : 0.5}
            value={displayGoalWeight}
            onChange={(event) =>
              onUpdateDraft((d) => {
                const snapped = snappedDisplayWeight(
                  Number(event.target.value),
                  d.useLbsGoalWeight,
                );
                d.goalWeightKg = kgFromDisplayWeight(snapped, d.useLbsGoalWeight);
              })
            }
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Goal date</span>
          <input
            type="date"
            value={toLocalDateInputValue(draft.goalTargetDate)}
            onChange={(event) =>
              onUpdateDraft((d) => {
                d.goalTargetDate = dateFromLocalDateInput(event.target.value);
              })
            }
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <div className="rounded-lg bg-neutral-50 p-3 text-sm">
          <p className="text-neutral-600">
            TDEE: <span className="font-medium text-neutral-900">{previewTDEE} kcal</span>
          </p>
          <p className="mt-1 text-neutral-600">
            Daily target:{' '}
            <span className="font-medium text-neutral-900">{previewTarget} kcal</span>
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Minimum safe intake: {minimumCalories} kcal
          </p>
        </div>
      </div>
    </SettingsSectionCard>
  );
}
