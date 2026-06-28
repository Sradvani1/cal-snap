import {
  doc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { copy } from '@/lib/copy';
import { getFirestoreDb } from '@/lib/firebase/client';
import type { WeighIn } from '@/lib/models/weigh-in';
import { weighInToDoc } from '@/lib/models/weigh-in-doc';
import {
  PROFILE_DOC_ID,
  type ProfileExtras,
} from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import {
  ageFromDateOfBirth,
  bmi,
  bmr,
  dailyTarget,
  isOnPlateau,
  tdee,
} from '@/lib/nutrition/calculator';
import {
  profileToDoc,
  updateProfileAfterWeighIn,
} from '@/lib/repositories/profile';
import { fetchWeeklyPlateauWeighIns } from '@/lib/repositories/weigh-ins';
import { WEIGHT_RANGE_KG } from '@/lib/utilities/unit-formatters';

export interface WeighInRecalculation {
  tdee: number;
  dailyTarget: number;
  deficitKcal: number;
  bmi: number;
}

export interface SaveWeighInInput {
  uid: string;
  profile: UserProfile;
  profileExtras: ProfileExtras;
  newWeightKg: number;
  date: Date;
}

export interface SaveWeighInResult {
  weighIn: WeighIn;
  updatedProfile: UserProfile;
  didTriggerPlateau: boolean;
}

export class WeighInValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeighInValidationError';
  }
}

export interface SaveWeighInDeps {
  db?: Firestore;
  fetchWeeklyPlateauWeighIns?: typeof fetchWeeklyPlateauWeighIns;
}

export function recalculateWeighIn(
  profile: UserProfile,
  newWeightKg: number,
): WeighInRecalculation {
  const age = ageFromDateOfBirth(profile.dateOfBirth);
  const bmrValue = bmr(newWeightKg, profile.heightCm, age, profile.sex);
  const tdeeValue = tdee(bmrValue, profile.activityLevel);
  const targetResult = dailyTarget(tdeeValue, profile.deficitKcal, profile.sex);

  return {
    tdee: Math.round(tdeeValue),
    dailyTarget: targetResult.target,
    deficitKcal: targetResult.deficit,
    bmi: bmi(newWeightKg, profile.heightCm),
  };
}

function validateWeighInInput(newWeightKg: number, date: Date, now: Date = new Date()): Date {
  if (newWeightKg <= 0 || newWeightKg < WEIGHT_RANGE_KG.min || newWeightKg > WEIGHT_RANGE_KG.max) {
    throw new WeighInValidationError(copy('progress.validation.weightRange'));
  }

  const normalizedDate = startOfLocalDay(date);
  const todayStart = startOfLocalDay(now);
  if (normalizedDate > todayStart) {
    throw new WeighInValidationError(copy('progress.validation.futureDate'));
  }

  return normalizedDate;
}

export async function saveWeighIn(
  input: SaveWeighInInput,
  deps: SaveWeighInDeps = {},
): Promise<SaveWeighInResult> {
  const { uid, profile, profileExtras, newWeightKg, date } = input;
  const db = deps.db ?? getFirestoreDb();
  const fetchPlateauWeighIns = deps.fetchWeeklyPlateauWeighIns ?? fetchWeeklyPlateauWeighIns;

  const normalizedDate = validateWeighInInput(newWeightKg, date);
  const recalculation = recalculateWeighIn(profile, newWeightKg);
  const weighInId = crypto.randomUUID();
  const now = new Date();

  const weighIn: WeighIn = {
    id: weighInId,
    userId: uid,
    date: normalizedDate,
    weightKg: newWeightKg,
    calculatedTDEE: recalculation.tdee,
    adjustedDailyTarget: recalculation.dailyTarget,
    bmi: recalculation.bmi,
    source: 'manual',
    createdAt: now,
  };

  const { profile: updatedProfile, extras: updatedExtras } = updateProfileAfterWeighIn(
    profile,
    profileExtras,
    newWeightKg,
    recalculation,
    now,
  );

  const batch = writeBatch(db);
  batch.set(
    doc(db, 'users', uid, 'weighIns', weighInId),
    weighInToDoc(weighIn),
  );
  batch.set(
    doc(db, 'users', uid, 'profile', PROFILE_DOC_ID),
    profileToDoc(updatedProfile, updatedExtras),
  );
  await batch.commit();

  const plateauWeighIns = await fetchPlateauWeighIns(uid, undefined, undefined, db);
  const didTriggerPlateau = isOnPlateau(plateauWeighIns);

  return { weighIn, updatedProfile, didTriggerPlateau };
}
