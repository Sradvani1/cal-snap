'use client';

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

interface ProfileSetupStepProps {
  draft: ProfileDraft;
  onUpdate: (update: (draft: ProfileDraft) => void) => void;
}

export function ProfileSetupStep({ draft, onUpdate }: ProfileSetupStepProps) {
  const { feet, inches } = cmToFeetInches(draft.heightCm);
  const displayWeightValue = displayWeight(draft.weightKg, draft.useLbsWeight);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">About you</h2>
        <p className="mt-1 text-sm text-neutral-600">Tell us a bit about yourself.</p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Name (optional)</span>
        <input
          type="text"
          value={draft.name}
          onChange={(event) =>
            onUpdate((d) => {
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
                name="sex"
                checked={draft.sex === sex}
                onChange={() =>
                  onUpdate((d) => {
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
            onUpdate((d) => {
              d.dateOfBirth = dateFromLocalDateInput(event.target.value);
            })
          }
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">Height</span>
          <button
            type="button"
            onClick={() =>
              onUpdate((d) => {
                d.useImperialHeight = !d.useImperialHeight;
              })
            }
            className="text-xs font-medium text-neutral-600 underline"
          >
            {draft.useImperialHeight ? 'Use cm' : 'Use ft/in'}
          </button>
        </div>
        {draft.useImperialHeight ? (
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span>Feet</span>
              <input
                type="number"
                min={4}
                max={8}
                value={feet}
                onChange={(event) =>
                  onUpdate((d) => {
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
                  onUpdate((d) => {
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
              onUpdate((d) => {
                d.heightCm = Number(event.target.value);
              })
            }
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">Current weight</span>
          <button
            type="button"
            onClick={() =>
              onUpdate((d) => {
                d.useLbsWeight = !d.useLbsWeight;
              })
            }
            className="text-xs font-medium text-neutral-600 underline"
          >
            {draft.useLbsWeight ? 'Use kg' : 'Use lbs'}
          </button>
        </div>
        <input
          type="number"
          step={draft.useLbsWeight ? 1 : 0.5}
          value={displayWeightValue}
          onChange={(event) =>
            onUpdate((d) => {
              const snapped = snappedDisplayWeight(
                Number(event.target.value),
                d.useLbsWeight,
              );
              d.weightKg = kgFromDisplayWeight(snapped, d.useLbsWeight);
            })
          }
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
