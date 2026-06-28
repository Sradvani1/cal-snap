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
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface ProfileSetupStepProps {
  draft: ProfileDraft;
  onUpdate: (update: (draft: ProfileDraft) => void) => void;
}

const inputClassName =
  'rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm text-cs-foreground';

export function ProfileSetupStep({ draft, onUpdate }: ProfileSetupStepProps) {
  const { feet, inches } = cmToFeetInches(draft.heightCm);
  const displayWeightValue = displayWeight(draft.weightKg, draft.useLbsWeight);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className={typography.csCardTitle}>{copy('onboarding.profile.title')}</h2>
        <p className={`${typography.csCaption} mt-1`}>{copy('onboarding.profile.subtitle')}</p>
      </div>

      <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
        {copy('common.label.nameOptional')}
        <input
          type="text"
          value={draft.name}
          onChange={(event) =>
            onUpdate((d) => {
              d.name = event.target.value;
            })
          }
          className={inputClassName}
          placeholder={copy('common.placeholder.yourName')}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={typography.csMacroLabel}>{copy('common.label.sex')}</legend>
        <div className="flex gap-3">
          {(['male', 'female'] as const).map((sex) => (
            <label key={sex} className={cn(typography.csCaption, 'flex items-center gap-2 capitalize')}>
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
              {copy(sex === 'male' ? 'common.sex.male' : 'common.sex.female')}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
        {copy('common.label.dateOfBirth')}
        <input
          type="date"
          value={toLocalDateInputValue(draft.dateOfBirth)}
          onChange={(event) =>
            onUpdate((d) => {
              d.dateOfBirth = dateFromLocalDateInput(event.target.value);
            })
          }
          className={inputClassName}
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={typography.csMacroLabel}>{copy('common.label.height')}</span>
          <button
            type="button"
            onClick={() =>
              onUpdate((d) => {
                d.useImperialHeight = !d.useImperialHeight;
              })
            }
            className={`${typography.csCaption} font-medium underline`}
          >
            {draft.useImperialHeight ? copy('common.units.useCm') : copy('common.units.useFtIn')}
          </button>
        </div>
        {draft.useImperialHeight ? (
          <div className="flex gap-3">
            <label className={cn(typography.csCaption, 'flex flex-1 flex-col gap-1')}>
              {copy('common.label.feet')}
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
                className={inputClassName}
              />
            </label>
            <label className={cn(typography.csCaption, 'flex flex-1 flex-col gap-1')}>
              {copy('common.label.inches')}
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
                className={inputClassName}
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
            className={inputClassName}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={typography.csMacroLabel}>{copy('onboarding.profile.currentWeight')}</span>
          <button
            type="button"
            onClick={() =>
              onUpdate((d) => {
                d.useLbsWeight = !d.useLbsWeight;
              })
            }
            className={`${typography.csCaption} font-medium underline`}
          >
            {draft.useLbsWeight ? copy('common.units.useKg') : copy('common.units.useLbs')}
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
          className={inputClassName}
        />
      </div>
    </div>
  );
}
