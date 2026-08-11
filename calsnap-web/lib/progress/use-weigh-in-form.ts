'use client';

import { useCallback, useMemo, useState } from 'react';
import type { UserProfile } from '@/lib/models/user-profile';
import { recalculateWeighIn } from '@/lib/services/weigh-in-service';
import {
  displayWeight,
  kgFromDisplayWeight,
  WEIGHT_RANGE_KG,
  weightDisplayRange,
  weightDisplayStep,
} from '@/lib/utilities/unit-formatters';
import {
  dateFromLocalDateInput,
  isValidLocalDateInputValue,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';

export function useWeighInForm(
  profile: UserProfile,
  currentWeightKg: number,
  initialUseLbs: boolean,
) {
  const [useLbs, setUseLbsState] = useState(initialUseLbs);
  const [weightInput, setWeightInput] = useState(() =>
    String(displayWeight(currentWeightKg, initialUseLbs)),
  );
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateInputValue(new Date()));

  const weightKg = useMemo(
    () => kgFromDisplayWeight(Number.parseFloat(weightInput) || 0, useLbs),
    [weightInput, useLbs],
  );

  const preview = useMemo(
    () => recalculateWeighIn(profile, weightKg > 0 ? weightKg : currentWeightKg),
    [profile, weightKg, currentWeightKg],
  );

  const range = weightDisplayRange(useLbs);
  const step = weightDisplayStep();

  const isDateValid = isValidLocalDateInputValue(selectedDate);

  const canSave = useMemo(() => {
    const parsed = Number.parseFloat(weightInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return false;
    }
    const kg = kgFromDisplayWeight(parsed, useLbs);
    return isDateValid && kg > 0 && kg >= WEIGHT_RANGE_KG.min && kg <= WEIGHT_RANGE_KG.max;
  }, [isDateValid, weightInput, useLbs]);

  const setUseLbs = useCallback(
    (newValue: boolean) => {
      if (newValue === useLbs) {
        return;
      }
      const kg = weightKg > 0 ? weightKg : currentWeightKg;
      setUseLbsState(newValue);
      setWeightInput(String(displayWeight(kg, newValue)));
    },
    [useLbs, weightKg, currentWeightKg],
  );

  const setDateInputValue = useCallback((value: string) => {
    setSelectedDate(value);
  }, []);

  const selectedDateValue = useMemo(
    () => (isDateValid ? dateFromLocalDateInput(selectedDate) : null),
    [isDateValid, selectedDate],
  );

  const maxDateInput = toLocalDateInputValue(new Date());

  return {
    useLbs,
    setUseLbs,
    weightInput,
    setWeightInput,
    weightKg,
    selectedDate,
    setDateInputValue,
    selectedDateValue,
    isDateValid,
    maxDateInput,
    step,
    range,
    canSave,
    previousTDEE: profile.tdee,
    previousDailyTarget: profile.dailyCalorieTarget,
    previewTDEE: preview.tdee,
    previewDailyTarget: preview.dailyTarget,
  };
}
