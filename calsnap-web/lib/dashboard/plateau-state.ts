import { AppConstants } from '@/lib/constants';
import type { BiologicalSex } from '@/lib/models/biological-sex';
import type { UserProfile } from '@/lib/models/user-profile';
import type { WeighIn } from '@/lib/models/weigh-in';
import { isOnPlateau } from '@/lib/nutrition/calculator';

export function plateauSnoozeKey(uid: string): string {
  return `plateauSnoozeUntil_${uid}`;
}

export function maintenanceModeKey(uid: string): string {
  return `maintenanceModeUntil_${uid}`;
}

export function readStoredDate(key: string): Date | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  const interval = Number.parseFloat(raw);
  if (!Number.isFinite(interval) || interval <= 0) {
    return null;
  }
  return new Date(interval);
}

export function storeDate(key: string, date: Date): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, String(date.getTime()));
}

export function isMaintenanceModeActive(uid: string, now: Date = new Date()): boolean {
  const endDate = readStoredDate(maintenanceModeKey(uid));
  return endDate !== null && endDate > now;
}

export function isPlateauSnoozed(uid: string, now: Date = new Date()): boolean {
  const endDate = readStoredDate(plateauSnoozeKey(uid));
  return endDate !== null && endDate > now;
}

export function shouldShowPlateauAlert(
  profile: UserProfile | null | undefined,
  plateauWeighIns: WeighIn[],
  uid: string,
  now: Date = new Date(),
): boolean {
  if (!profile) {
    return false;
  }
  if (isMaintenanceModeActive(uid, now) || isPlateauSnoozed(uid, now)) {
    return false;
  }
  if (plateauWeighIns.length < AppConstants.Plateau.weeksToDetect) {
    return false;
  }
  return isOnPlateau(plateauWeighIns);
}

export function applyDietBreakTargets(profile: UserProfile): UserProfile {
  return {
    ...profile,
    dailyCalorieTarget: profile.tdee,
    deficitKcal: 0,
    updatedAt: new Date(),
  };
}

export function applySmallReductionTargets(profile: UserProfile): UserProfile {
  const minimum = minimumCalories(profile.sex);
  const dailyCalorieTarget = Math.max(minimum, profile.dailyCalorieTarget - 60);
  return {
    ...profile,
    dailyCalorieTarget,
    deficitKcal: profile.tdee - dailyCalorieTarget,
    updatedAt: new Date(),
  };
}

export function maintenanceModeEndDate(now: Date = new Date()): Date {
  const result = new Date(now);
  result.setDate(result.getDate() + 14);
  return result;
}

export function plateauSnoozeEndDate(now: Date = new Date()): Date {
  const result = new Date(now);
  result.setDate(result.getDate() + 14);
  return result;
}

function minimumCalories(sex: BiologicalSex): number {
  return sex === 'male'
    ? AppConstants.Deficit.minCaloriesMale
    : AppConstants.Deficit.minCaloriesFemale;
}
