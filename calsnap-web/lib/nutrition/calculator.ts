import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { activityMultiplier, type ActivityLevel } from '@/lib/models/activity-level';
import type { BiologicalSex } from '@/lib/models/biological-sex';
import type { MacroSplit } from '@/lib/models/macro-split';
import type { WeighIn } from '@/lib/models/weigh-in';

export function bmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: BiologicalSex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

export function tdee(bmrValue: number, activityLevel: ActivityLevel): number {
  return bmrValue * activityMultiplier(activityLevel);
}

export function dailyTarget(
  tdeeValue: number,
  requestedDeficit: number,
  sex: BiologicalSex,
): { target: number; deficit: number; warnings: string[] } {
  const warnings: string[] = [];
  let deficit = requestedDeficit;

  if (deficit > AppConstants.Deficit.hardMaxDeficitKcal) {
    deficit = AppConstants.Deficit.hardMaxDeficitKcal;
    warnings.push(
      copy('onboarding.warning.deficitCapped', {
        max: AppConstants.Deficit.hardMaxDeficitKcal,
      }),
    );
  }
  if (deficit > AppConstants.Deficit.maxDeficitKcal) {
    warnings.push(
      copy('onboarding.warning.highDeficit', {
        max: AppConstants.Deficit.maxDeficitKcal,
      }),
    );
  }

  const minimum =
    sex === 'male'
      ? AppConstants.Deficit.minCaloriesMale
      : AppConstants.Deficit.minCaloriesFemale;
  const rawTarget = Math.trunc(tdeeValue) - deficit;
  const target = Math.max(rawTarget, minimum);

  if (rawTarget < minimum) {
    warnings.push(
      copy('onboarding.warning.targetFloored', { minimum }),
    );
  }

  return { target, deficit, warnings };
}

export function macroTargets(
  dailyCalories: number,
  proteinPct: number,
  carbsPct: number,
  fatPct: number,
): { proteinG: number; totalCarbsG: number; fatG: number; fiberG: number } {
  const rawFiberG = fiberTargetG(dailyCalories);
  const fiberCal = rawFiberG * AppConstants.Nutrition.fiberCalPerGram;
  const remainingCal = dailyCalories - fiberCal;
  const roundedFiberG = Math.round(rawFiberG);

  return {
    proteinG: Math.round((remainingCal * proteinPct) / AppConstants.Nutrition.proteinCalPerGram),
    totalCarbsG:
      Math.round((remainingCal * carbsPct) / AppConstants.Nutrition.carbsCalPerGram)
      + roundedFiberG,
    fatG: Math.round((remainingCal * fatPct) / AppConstants.Nutrition.fatCalPerGram),
    fiberG: roundedFiberG,
  };
}

export function macroPercents(
  proteinG: number,
  carbsG: number,
  fatG: number,
): MacroSplit {
  const proteinKcal = proteinG * AppConstants.Nutrition.proteinCalPerGram;
  const carbsKcal = carbsG * AppConstants.Nutrition.carbsCalPerGram;
  const fatKcal = fatG * AppConstants.Nutrition.fatCalPerGram;
  const total = proteinKcal + carbsKcal + fatKcal;

  if (total <= 0) {
    return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  }

  return {
    proteinPct: Math.round((proteinKcal / total) * 100),
    carbsPct: Math.round((carbsKcal / total) * 100),
    fatPct: Math.round((fatKcal / total) * 100),
  };
}

export function fiberTargetG(dailyCalorieTarget: number): number {
  return (dailyCalorieTarget / 1000) * AppConstants.Nutrition.fiberGramsPer1000Kcal;
}

export function bmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function ageFromDateOfBirth(
  dob: Date,
  referenceDate: Date = new Date(),
): number {
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function weightProjection(
  startWeightKg: number,
  heightCm: number,
  ageYears: number,
  sex: BiologicalSex,
  activityLevel: ActivityLevel,
  dailyDeficitKcal: number,
  weeks: number,
): Array<{ week: number; weightKg: number }> {
  const results: Array<{ week: number; weightKg: number }> = [
    { week: 0, weightKg: startWeightKg },
  ];
  let currentWeight = startWeightKg;

  for (let week = 1; week <= weeks; week += 1) {
    const currentBMR = bmr(currentWeight, heightCm, ageYears, sex);
    const currentTDEE = tdee(currentBMR, activityLevel);
    void currentTDEE; // retained for W06 dynamic deficit recalculation
    const weeklyDeficit = dailyDeficitKcal * 7;
    const adaptationFactor = week > 4 ? 0.95 : 1.0;
    const effectiveDeficit = weeklyDeficit * adaptationFactor;
    const weightLossKg = effectiveDeficit / 7700;
    currentWeight = Math.max(currentWeight - weightLossKg, currentWeight * 0.7);
    results.push({ week, weightKg: currentWeight });
  }

  return results;
}

export function isOnPlateau(weighIns: WeighIn[]): boolean {
  if (weighIns.length < AppConstants.Plateau.weeksToDetect) {
    return false;
  }

  const recent = [...weighIns]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-AppConstants.Plateau.weeksToDetect);
  const weights = recent.map((entry) => entry.weightKg);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  return maxWeight - minWeight < AppConstants.Plateau.weightChangeThresholdKg;
}

export function weeklyLossRateKg(weighIns: WeighIn[]): number | null {
  if (weighIns.length < 2) {
    return null;
  }

  const sorted = [...weighIns].sort((a, b) => a.date.getTime() - b.date.getTime());
  const recent = sorted.slice(-4);
  if (recent.length < 2) {
    return null;
  }

  const first = recent[0];
  const last = recent[recent.length - 1];
  const days = Math.floor(
    (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 0) {
    return null;
  }

  const lossKg = first.weightKg - last.weightKg;
  return (lossKg / days) * 7;
}

function addWeeks(date: Date, weeks: number, calendar?: { addWeeks: (d: Date, w: number) => Date }): Date {
  if (calendar) {
    return calendar.addWeeks(date, weeks);
  }
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function projectedGoalDate(
  currentWeightKg: number,
  goalWeightKg: number,
  heightCm: number,
  ageYears: number,
  sex: BiologicalSex,
  activityLevel: ActivityLevel,
  dailyDeficitKcal: number,
  referenceDate: Date = new Date(),
  calendar?: { addWeeks: (date: Date, weeks: number) => Date },
): Date | null {
  if (dailyDeficitKcal <= 0 || currentWeightKg <= goalWeightKg) {
    return null;
  }

  const projection = weightProjection(
    currentWeightKg,
    heightCm,
    ageYears,
    sex,
    activityLevel,
    dailyDeficitKcal,
    AppConstants.WeightProjection.maxWeeks,
  );

  const goalWeek = projection.find((point) => point.weightKg <= goalWeightKg)?.week;
  if (goalWeek === undefined) {
    return null;
  }

  return addWeeks(referenceDate, goalWeek, calendar);
}

export function projectionPoints(
  startWeightKg: number,
  goalWeightKg: number,
  heightCm: number,
  ageYears: number,
  sex: BiologicalSex,
  activityLevel: ActivityLevel,
  dailyDeficitKcal: number,
  startDate: Date = new Date(),
  calendar?: { addWeeks: (date: Date, weeks: number) => Date },
): Array<{ date: Date; weightKg: number }> {
  if (dailyDeficitKcal <= 0) {
    return [];
  }

  const projection = weightProjection(
    startWeightKg,
    heightCm,
    ageYears,
    sex,
    activityLevel,
    dailyDeficitKcal,
    AppConstants.WeightProjection.maxWeeks,
  );

  const points: Array<{ date: Date; weightKg: number }> = [];
  for (const { week, weightKg } of projection) {
    points.push({ date: addWeeks(startDate, week, calendar), weightKg });
    if (weightKg <= goalWeightKg) {
      break;
    }
  }

  return points;
}
