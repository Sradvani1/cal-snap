import type { UserProfile } from '@/lib/models/user-profile';
import type { WeighIn } from '@/lib/models/weigh-in';
import { copy } from '@/lib/copy';
import {
  ageFromDateOfBirth,
  projectedGoalDate,
  projectionPoints,
  weeklyLossRateKg,
} from '@/lib/nutrition/calculator';

export interface ProgressStats {
  currentWeightKg: number;
  lostSoFarKg: number;
  toGoalKg: number;
  progressFraction: number;
  chartWeighInsAscending: WeighIn[];
  weeklyRateKg: number | null;
  projectedGoalDate: Date | null;
  projectionPoints: Array<{ date: Date; weightKg: number }>;
}

/** Newest first: date desc, then createdAt desc, then id desc. */
export function compareWeighInsByRecency(a: WeighIn, b: WeighIn): number {
  const dateDiff = b.date.getTime() - a.date.getTime();
  if (dateDiff !== 0) {
    return dateDiff;
  }
  const aCreated = a.createdAt?.getTime() ?? 0;
  const bCreated = b.createdAt?.getTime() ?? 0;
  if (bCreated !== aCreated) {
    return bCreated - aCreated;
  }
  return b.id.localeCompare(a.id);
}

export function latestWeighIn(weighIns: WeighIn[]): WeighIn | undefined {
  if (weighIns.length === 0) {
    return undefined;
  }
  return [...weighIns].sort(compareWeighInsByRecency)[0];
}

export function currentWeightKg(
  weighIns: WeighIn[],
  startingWeightKg: number,
): number {
  return latestWeighIn(weighIns)?.weightKg ?? startingWeightKg;
}

export function lostSoFarKg(startingWeightKg: number, currentKg: number): number {
  return Math.max(0, startingWeightKg - currentKg);
}

export function toGoalKg(currentKg: number, goalWeightKg: number): number {
  return Math.max(0, currentKg - goalWeightKg);
}

export function progressFraction(
  startingWeightKg: number,
  goalWeightKg: number,
  currentKg: number,
): number {
  const total = startingWeightKg - goalWeightKg;
  if (total <= 0) {
    return 0;
  }
  const progress = startingWeightKg - currentKg;
  return Math.min(Math.max(progress / total, 0), 1);
}

export function sortWeighInsNewestFirst(weighIns: WeighIn[]): WeighIn[] {
  return [...weighIns].sort(compareWeighInsByRecency);
}

export function compareWeighInsChronological(a: WeighIn, b: WeighIn): number {
  const dateDiff = a.date.getTime() - b.date.getTime();
  if (dateDiff !== 0) {
    return dateDiff;
  }
  const aCreated = a.createdAt?.getTime() ?? 0;
  const bCreated = b.createdAt?.getTime() ?? 0;
  if (aCreated !== bCreated) {
    return aCreated - bCreated;
  }
  return a.id.localeCompare(b.id);
}

export function deriveProgressStats(
  profile: UserProfile,
  weighIns: WeighIn[],
  referenceDate: Date = new Date(),
): ProgressStats {
  const currentKg = currentWeightKg(weighIns, profile.startingWeightKg);
  const chartWeighInsAscending = [...weighIns].sort(compareWeighInsChronological);
  const age = ageFromDateOfBirth(profile.dateOfBirth, referenceDate);
  const weeklyRate = weeklyLossRateKg(chartWeighInsAscending);
  const projectedDate = projectedGoalDate(
    currentKg,
    profile.goalWeightKg,
    profile.heightCm,
    age,
    profile.sex,
    profile.activityLevel,
    profile.deficitKcal,
    referenceDate,
  );
  const latestEntry = latestWeighIn(weighIns);
  const latestWeighInDate = latestEntry?.date ?? referenceDate;

  return {
    currentWeightKg: currentKg,
    lostSoFarKg: lostSoFarKg(profile.startingWeightKg, currentKg),
    toGoalKg: toGoalKg(currentKg, profile.goalWeightKg),
    progressFraction: progressFraction(
      profile.startingWeightKg,
      profile.goalWeightKg,
      currentKg,
    ),
    chartWeighInsAscending,
    weeklyRateKg: weeklyRate,
    projectedGoalDate: projectedDate,
    projectionPoints: projectionPoints(
      currentKg,
      profile.goalWeightKg,
      profile.heightCm,
      age,
      profile.sex,
      profile.activityLevel,
      profile.deficitKcal,
      latestWeighInDate,
    ),
  };
}

export function progressAccessibilityValue(progressFractionValue: number): string {
  const percent = Math.round(progressFractionValue * 100);
  return copy('progress.bar.a11y', { percent });
}

export function chartAccessibilitySummary(
  weighIns: WeighIn[],
  currentKg: number,
  startingWeightKg: number,
  goalWeightKg: number,
  formatWeight: (kg: number) => string,
): string {
  if (weighIns.length === 0) {
    return copy('progress.chart.a11y.empty');
  }

  const current = formatWeight(currentKg);
  const goal = formatWeight(goalWeightKg);
  const change = currentKg - startingWeightKg;

  let direction: string;
  if (change < -0.1) {
    direction = copy('progress.chart.a11y.directionDown', {
      amount: formatWeight(Math.abs(change)),
    });
  } else if (change > 0.1) {
    direction = copy('progress.chart.a11y.directionUp', {
      amount: formatWeight(change),
    });
  } else {
    direction = copy('progress.chart.a11y.unchanged');
  }

  return copy('progress.chart.a11y.summary', { current, direction, goal });
}
