'use client';

import { useMemo } from 'react';
import {
  HeightInputFields,
} from '@/components/design/HeightInputFields';
import { LocalDateInput } from '@/components/design/LocalDateInput';
import { LocalNumberInput } from '@/components/design/LocalNumberInput';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { dateOfBirthInputBounds } from '@/lib/utilities/date-input';
import { weightInputHandlers } from '@/lib/utilities/unit-formatters';
import { copy } from '@/lib/copy';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface ProfileSetupStepProps {
  draft: ProfileDraft;
  onUpdate: (update: (draft: ProfileDraft) => void) => void;
}

export function ProfileSetupStep({ draft, onUpdate }: ProfileSetupStepProps) {
  const dobBounds = useMemo(() => dateOfBirthInputBounds(), []);
  const weightHandlers = useMemo(
    () => weightInputHandlers(draft.useLbsWeight),
    [draft.useLbsWeight],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
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
          className={formFieldInputClassName}
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

      <label className={cn(typography.csMacroLabel, 'flex min-w-0 flex-col gap-1')}>
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
          className={formFieldInputClassName}
        />
      </label>

      <HeightInputFields
        heightCm={draft.heightCm}
        useImperialHeight={draft.useImperialHeight}
        onHeightCmChange={(heightCm) =>
          onUpdate((d) => {
            d.heightCm = heightCm;
          })
        }
        onToggleImperial={() =>
          onUpdate((d) => {
            d.useImperialHeight = !d.useImperialHeight;
          })
        }
      />

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className={typography.csMacroLabel}>{copy('onboarding.profile.currentWeight')}</span>
          <button
            type="button"
            onClick={() =>
              onUpdate((d) => {
                d.useLbsWeight = !d.useLbsWeight;
              })
            }
            className={cn(typography.csCaption, 'shrink-0 font-medium underline')}
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
          className={formFieldInputClassName}
        />
      </div>
    </div>
  );
}
