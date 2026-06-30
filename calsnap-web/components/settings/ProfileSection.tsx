'use client';

import { useMemo } from 'react';
import { ACTIVITY_LEVEL_OPTIONS } from '@/lib/onboarding/activity-level-options';
import {
  HeightInputFields,
} from '@/components/design/HeightInputFields';
import { LocalDateInput } from '@/components/design/LocalDateInput';
import { LocalNumberInput } from '@/components/design/LocalNumberInput';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { dateOfBirthInputBounds, goalTargetDateInputBounds } from '@/lib/utilities/date-input';
import { weightInputHandlers } from '@/lib/utilities/unit-formatters';
import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

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
  const dobBounds = useMemo(() => dateOfBirthInputBounds(), []);
  const goalDateBounds = useMemo(() => goalTargetDateInputBounds(), []);
  const weightHandlers = useMemo(
    () => weightInputHandlers(useLbsForWeight),
    [useLbsForWeight],
  );
  const goalWeightHandlers = useMemo(
    () => weightInputHandlers(draft.useLbsGoalWeight),
    [draft.useLbsGoalWeight],
  );
  const weightUnit = useLbsForWeight ? copy('common.units.lbs') : copy('common.units.kg');
  const goalWeightUnit = draft.useLbsGoalWeight
    ? copy('common.units.lbs')
    : copy('common.units.kg');

  return (
    <SectionCard title={copy('settings.section.profile')}>
      <div className="flex min-w-0 flex-col gap-4">
        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('common.label.nameOptional')}
          <input
            type="text"
            value={draft.name}
            onChange={(event) =>
              onUpdateDraft((d) => {
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
                  name="settings-sex"
                  checked={draft.sex === sex}
                  onChange={() =>
                    onUpdateDraft((d) => {
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
              onUpdateDraft((d) => {
                d.dateOfBirth = date;
              })
            }
            className={formFieldInputClassName}
          />
        </label>

        <HeightInputFields
          heightCm={draft.heightCm}
          useImperialHeight={useImperialForHeight}
          onHeightCmChange={(heightCm) =>
            onUpdateDraft((d) => {
              d.heightCm = heightCm;
            })
          }
        />

        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('settings.profile.currentWeight', { unit: weightUnit })}
          <LocalNumberInput
            key={useLbsForWeight ? 'lbs' : 'kg'}
            inputMode="decimal"
            value={currentWeightKg}
            formatDisplay={weightHandlers.formatDisplay}
            commitValue={weightHandlers.commitValue}
            onChange={(display) => {
              onWeightChange(weightHandlers.toKg(display));
            }}
            className={formFieldInputClassName}
          />
        </label>

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
                <span className={cn(typography.csCaption, 'ml-6 break-words')}>{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('settings.profile.goalWeight', { unit: goalWeightUnit })}
          <LocalNumberInput
            key={draft.useLbsGoalWeight ? 'lbs' : 'kg'}
            inputMode="decimal"
            value={draft.goalWeightKg}
            formatDisplay={goalWeightHandlers.formatDisplay}
            commitValue={goalWeightHandlers.commitValue}
            onChange={(display) =>
              onUpdateDraft((d) => {
                d.goalWeightKg = goalWeightHandlers.toKg(display);
              })
            }
            className={formFieldInputClassName}
          />
        </label>

        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('settings.profile.goalDate')}
          <LocalDateInput
            value={draft.goalTargetDate}
            min={goalDateBounds.min}
            max={goalDateBounds.max}
            onChange={(date) =>
              onUpdateDraft((d) => {
                d.goalTargetDate = date;
              })
            }
            className={formFieldInputClassName}
          />
        </label>

        <div className="rounded-lg bg-cs-muted/10 p-3 text-sm">
          <p className={typography.csCaption}>
            {copy('settings.profile.tdee', { value: previewTDEE })}
          </p>
          <p className={`${typography.csCaption} mt-1`}>
            {copy('settings.profile.dailyTarget', { value: previewTarget })}
          </p>
          <p className={`${typography.csCaption} mt-1 text-xs`}>
            {copy('settings.profile.minimumIntake', { value: minimumCalories })}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
