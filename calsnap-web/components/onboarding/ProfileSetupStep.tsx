'use client';

import { useMemo } from 'react';
import { LocalDateInput } from '@/components/design/LocalDateInput';
import {
  LocalNumberInput,
  parseIntegerInputValue,
} from '@/components/design/LocalNumberInput';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { dateOfBirthInputBounds } from '@/lib/utilities/date-input';
import {
  cmToFeetInches,
  feetInchesToCm,
  weightInputHandlers,
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

const clampFeet = (value: number) => Math.min(8, Math.max(4, value));
const clampInches = (value: number) => Math.min(11, Math.max(0, value));

export function ProfileSetupStep({ draft, onUpdate }: ProfileSetupStepProps) {
  const dobBounds = useMemo(() => dateOfBirthInputBounds(), []);
  const { feet, inches } = cmToFeetInches(draft.heightCm);
  const weightHandlers = useMemo(
    () => weightInputHandlers(draft.useLbsWeight),
    [draft.useLbsWeight],
  );

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
        <LocalDateInput
          value={draft.dateOfBirth}
          min={dobBounds.min}
          max={dobBounds.max}
          onChange={(date) =>
            onUpdate((d) => {
              d.dateOfBirth = date;
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
          <div key="imperial" className="flex gap-3">
            <label className={cn(typography.csCaption, 'flex flex-1 flex-col gap-1')}>
              {copy('common.label.feet')}
              <LocalNumberInput
                inputMode="numeric"
                value={feet}
                parseInput={parseIntegerInputValue}
                commitValue={clampFeet}
                onChange={(nextFeet) =>
                  onUpdate((d) => {
                    const { inches: currentInches } = cmToFeetInches(d.heightCm);
                    d.heightCm = feetInchesToCm(nextFeet, currentInches);
                  })
                }
                className={inputClassName}
              />
            </label>
            <label className={cn(typography.csCaption, 'flex flex-1 flex-col gap-1')}>
              {copy('common.label.inches')}
              <LocalNumberInput
                inputMode="numeric"
                value={inches}
                parseInput={parseIntegerInputValue}
                commitValue={clampInches}
                onChange={(nextInches) =>
                  onUpdate((d) => {
                    const { feet: currentFeet } = cmToFeetInches(d.heightCm);
                    d.heightCm = feetInchesToCm(currentFeet, nextInches);
                  })
                }
                className={inputClassName}
              />
            </label>
          </div>
        ) : (
          <LocalNumberInput
            key="metric"
            inputMode="numeric"
            value={Math.round(draft.heightCm)}
            commitValue={(value) => Math.min(230, Math.max(120, Math.round(value)))}
            onChange={(value) =>
              onUpdate((d) => {
                d.heightCm = value;
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
        <LocalNumberInput
          key={draft.useLbsWeight ? 'lbs' : 'kg'}
          inputMode="decimal"
          value={draft.weightKg}
          formatDisplay={weightHandlers.formatDisplay}
          commitValue={weightHandlers.commitValue}
          onChange={(display) =>
            onUpdate((d) => {
              d.weightKg = weightHandlers.toKg(display);
            })
          }
          className={inputClassName}
        />
      </div>
    </div>
  );
}
