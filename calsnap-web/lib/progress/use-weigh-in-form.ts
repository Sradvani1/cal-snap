'use client';

import { useCallback, useMemo, useState } from 'react';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import type { UserProfile } from '@/lib/models/user-profile';
import { recalculateWeighIn } from '@/lib/services/weigh-in-service';
import {
  displayWeight,
  kgFromDisplayWeight,
  WEIGHT_RANGE_KG,
  weightDisplayRange,
  weightDisplayStep,
} from '@/lib/utilities/unit-formatters';

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromInputValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return startOfLocalDay(new Date(year, month - 1, day));
}

export function useWeighInForm(
  profile: UserProfile,
  currentWeightKg: number,
  initialUseLbs: boolean,
) {
  const [useLbs, setUseLbsState] = useState(initialUseLbs);
  const [weightInput, setWeightInput] = useState(() =>
    String(displayWeight(currentWeightKg, initialUseLbs)),
  );
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));

  const weightKg = useMemo(
    () => kgFromDisplayWeight(Number.parseFloat(weightInput) || 0, useLbs),
    [weightInput, useLbs],
  );

  const preview = useMemo(
    () => recalculateWeighIn(profile, weightKg > 0 ? weightKg : currentWeightKg),
    [profile, weightKg, currentWeightKg],
  );

  const range = weightDisplayRange(useLbs);
  const step = weightDisplayStep(useLbs);

  const canSave = useMemo(() => {
    const parsed = Number.parseFloat(weightInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return false;
    }
    const kg = kgFromDisplayWeight(parsed, useLbs);
    return kg > 0 && kg >= WEIGHT_RANGE_KG.min && kg <= WEIGHT_RANGE_KG.max;
  }, [weightInput, useLbs]);

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
    () => dateFromInputValue(selectedDate),
    [selectedDate],
  );

  const maxDateInput = toDateInputValue(new Date());

  return {
    useLbs,
    setUseLbs,
    weightInput,
    setWeightInput,
    weightKg,
    selectedDate,
    setDateInputValue,
    selectedDateValue,
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

export function setUseLbsConvertsWeight(
  weightKg: number,
  fromUseLbs: boolean,
  toUseLbs: boolean,
): { display: number; kg: number } {
  const display = displayWeight(weightKg, toUseLbs);
  return {
    display,
    kg: kgFromDisplayWeight(display, toUseLbs),
  };
}
