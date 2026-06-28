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
import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
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

const inputClassName =
  'rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm text-cs-foreground';

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
  const weightUnit = useLbsForWeight ? copy('common.units.lbs') : copy('common.units.kg');
  const goalWeightUnit = draft.useLbsGoalWeight
    ? copy('common.units.lbs')
    : copy('common.units.kg');

  return (
    <SectionCard title={copy('settings.section.profile')}>
      <div className="flex flex-col gap-4">
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
          <input
            type="date"
            value={toLocalDateInputValue(draft.dateOfBirth)}
            onChange={(event) =>
              onUpdateDraft((d) => {
                d.dateOfBirth = dateFromLocalDateInput(event.target.value);
              })
            }
            className={inputClassName}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className={typography.csMacroLabel}>{copy('common.label.height')}</span>
          {useImperialForHeight ? (
            <div className="flex gap-3">
              <label className={cn(typography.csCaption, 'flex flex-1 flex-col gap-1')}>
                {copy('common.label.feet')}
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
                    onUpdateDraft((d) => {
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
                onUpdateDraft((d) => {
                  d.heightCm = Number(event.target.value);
                })
              }
              className={inputClassName}
            />
          )}
        </div>

        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('settings.profile.currentWeight', { unit: weightUnit })}
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
            className={inputClassName}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className={typography.csMacroLabel}>{copy('common.label.activityLevel')}</legend>
          <div className="flex flex-col gap-2">
            {ACTIVITY_LEVEL_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm',
                  draft.activityLevel === option.value
                    ? 'border-cs-primary bg-cs-primary/10'
                    : 'border-cs-border',
                )}
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
                <span className={cn(typography.csCaption, 'ml-6')}>{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('settings.profile.goalWeight', { unit: goalWeightUnit })}
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
            className={inputClassName}
          />
        </label>

        <label className={cn(typography.csMacroLabel, 'flex flex-col gap-1')}>
          {copy('settings.profile.goalDate')}
          <input
            type="date"
            value={toLocalDateInputValue(draft.goalTargetDate)}
            onChange={(event) =>
              onUpdateDraft((d) => {
                d.goalTargetDate = dateFromLocalDateInput(event.target.value);
              })
            }
            className={inputClassName}
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
