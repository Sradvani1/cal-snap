import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import {
  type UserProfile,
} from '@/lib/models/user-profile';
import { getPresetValues } from '@/lib/models/macro-preset';
import {
  PROFILE_DOC_ID,
  type ProfileDoc,
  type ProfileExtras,
} from '@/lib/models/profile-doc';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { trimmedName } from '@/lib/onboarding/profile-draft';
import {
  ageFromDateOfBirth,
  bmr,
  dailyTarget,
  tdee,
} from '@/lib/nutrition/calculator';
import { computeGoalTargetDate } from '@/lib/nutrition/goal-pathway';
import {
  defaultReminderPrefs,
  resolveReminderPrefs,
} from '@/lib/progress/reminder-prefs';

export function makeProfileFromDraft(
  draft: ProfileDraft,
  uid: string,
): UserProfile {
  const age = ageFromDateOfBirth(draft.dateOfBirth);
  const bmrValue = bmr(draft.weightKg, draft.heightCm, age, draft.sex);
  const tdeeValue = tdee(bmrValue, draft.activityLevel);
  const targetResult = dailyTarget(tdeeValue, draft.requestedDeficit, draft.sex);
  const now = new Date();

  const presetValues = getPresetValues(draft.macroPresetKey ?? 'balanced');

  return {
    id: uid,
    name: trimmedName(draft),
    sex: draft.sex,
    dateOfBirth: draft.dateOfBirth,
    heightCm: draft.heightCm,
    startingWeightKg: draft.weightKg,
    goalWeightKg: draft.goalWeightKg,
    goalTargetDate: computeGoalTargetDate({
      currentWeightKg: draft.weightKg,
      goalWeightKg: draft.goalWeightKg,
      heightCm: draft.heightCm,
      dateOfBirth: draft.dateOfBirth,
      sex: draft.sex,
      activityLevel: draft.activityLevel,
      deficitKcal: targetResult.deficit,
      referenceDate: now,
    }),
    activityLevel: draft.activityLevel,
    dailyCalorieTarget: targetResult.target,
    tdee: Math.round(tdeeValue),
    deficitKcal: targetResult.deficit,
    macroTargetProteinPct: presetValues.proteinPct / 100,
    macroTargetCarbsPct: presetValues.carbsPct / 100,
    macroTargetFatPct: presetValues.fatPct / 100,
    createdAt: now,
    updatedAt: now,
  };
}

export function profileToDoc(
  profile: UserProfile,
  extras: ProfileExtras,
): ProfileDoc {
  return {
    name: profile.name,
    onboardingCompleted: extras.onboardingCompleted,
    sex: profile.sex,
    dateOfBirth: Timestamp.fromDate(profile.dateOfBirth),
    heightCm: profile.heightCm,
    startingWeightKg: profile.startingWeightKg,
    currentWeightKg: extras.currentWeightKg,
    goalWeightKg: profile.goalWeightKg,
    goalTargetDate: profile.goalTargetDate
      ? Timestamp.fromDate(profile.goalTargetDate)
      : null,
    activityLevel: profile.activityLevel,
    dailyCalorieTarget: profile.dailyCalorieTarget,
    tdee: profile.tdee,
    deficitKcal: profile.deficitKcal,
    macroTargetProteinPct: profile.macroTargetProteinPct,
    macroTargetCarbsPct: profile.macroTargetCarbsPct,
    macroTargetFatPct: profile.macroTargetFatPct,
    useLbsForWeight: extras.useLbsForWeight,
    useImperialForHeight: extras.useImperialForHeight,
    createdAt: Timestamp.fromDate(profile.createdAt),
    updatedAt: Timestamp.fromDate(profile.updatedAt),
    ...(extras.weighInReminderEnabled !== undefined
      ? { weighInReminderEnabled: extras.weighInReminderEnabled }
      : {}),
  };
}

export function docToProfile(docData: ProfileDoc, uid: string): UserProfile {
  return {
    id: uid,
    name: docData.name,
    sex: docData.sex,
    dateOfBirth: docData.dateOfBirth.toDate(),
    heightCm: docData.heightCm,
    startingWeightKg: docData.startingWeightKg,
    goalWeightKg: docData.goalWeightKg,
    goalTargetDate: docData.goalTargetDate?.toDate() ?? null,
    activityLevel: docData.activityLevel,
    dailyCalorieTarget: docData.dailyCalorieTarget,
    tdee: docData.tdee,
    deficitKcal: docData.deficitKcal,
    macroTargetProteinPct: docData.macroTargetProteinPct,
    macroTargetCarbsPct: docData.macroTargetCarbsPct,
    macroTargetFatPct: docData.macroTargetFatPct,
    createdAt: docData.createdAt.toDate(),
    updatedAt: docData.updatedAt.toDate(),
  };
}

export async function getProfileDoc(
  uid: string,
  db: Firestore = getFirestoreDb(),
): Promise<ProfileDoc | null> {
  const snapshot = await getDoc(doc(db, 'users', uid, 'profile', PROFILE_DOC_ID));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as ProfileDoc;
}

export async function getProfile(
  uid: string,
  db: Firestore = getFirestoreDb(),
): Promise<UserProfile | null> {
  const docData = await getProfileDoc(uid, db);
  if (!docData) {
    return null;
  }
  return docToProfile(docData, uid);
}

export async function isOnboardingComplete(
  uid: string,
  db: Firestore = getFirestoreDb(),
): Promise<boolean> {
  const docData = await getProfileDoc(uid, db);
  return docData?.onboardingCompleted === true;
}

export async function saveProfile(
  uid: string,
  profile: UserProfile,
  extras: ProfileExtras,
  db: Firestore = getFirestoreDb(),
): Promise<void> {
  const profileDoc = profileToDoc(profile, extras);
  await setDoc(doc(db, 'users', uid, 'profile', PROFILE_DOC_ID), profileDoc);
}

export async function saveProfileFromDraft(
  uid: string,
  draft: ProfileDraft,
  db: Firestore = getFirestoreDb(),
): Promise<ProfileWithExtras> {
  const profile = makeProfileFromDraft(draft, uid);
  const extras: ProfileExtras = {
    onboardingCompleted: true,
    currentWeightKg: draft.weightKg,
    useLbsForWeight: draft.useLbsWeight,
    useImperialForHeight: draft.useImperialHeight,
    ...defaultReminderPrefs(),
  };
  await saveProfile(uid, profile, extras, db);
  return { profile, extras };
}

export interface CalorieTargetUpdate {
  dailyCalorieTarget: number;
  deficitKcal: number;
}

export async function updateCalorieTargets(
  uid: string,
  targets: CalorieTargetUpdate,
  db: Firestore = getFirestoreDb(),
): Promise<UserProfile> {
  const docData = await getProfileDoc(uid, db);
  if (!docData) {
    throw new Error('Profile not found');
  }

  const profile = docToProfile(docData, uid);
  const referenceDate = new Date();
  const updatedProfile: UserProfile = {
    ...profile,
    dailyCalorieTarget: targets.dailyCalorieTarget,
    deficitKcal: targets.deficitKcal,
    goalTargetDate: computeGoalTargetDate({
      currentWeightKg: docData.currentWeightKg,
      goalWeightKg: profile.goalWeightKg,
      heightCm: profile.heightCm,
      dateOfBirth: profile.dateOfBirth,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      deficitKcal: targets.deficitKcal,
      referenceDate,
    }),
    updatedAt: referenceDate,
  };

  await saveProfile(uid, updatedProfile, {
    onboardingCompleted: docData.onboardingCompleted,
    currentWeightKg: docData.currentWeightKg,
    useLbsForWeight: docData.useLbsForWeight,
    useImperialForHeight: docData.useImperialForHeight,
    weighInReminderEnabled: docData.weighInReminderEnabled,
  }, db);

  return updatedProfile;
}

export interface ProfileAfterWeighInUpdate {
  profile: UserProfile;
  extras: ProfileExtras;
}

export interface WeighInProfileRecalculation {
  tdee: number;
  dailyTarget: number;
  deficitKcal: number;
}

export function updateProfileAfterWeighIn(
  profile: UserProfile,
  extras: ProfileExtras,
  newWeightKg: number,
  recalculation: WeighInProfileRecalculation,
  goalTargetDate: Date | null,
  updatedAt: Date = new Date(),
): ProfileAfterWeighInUpdate {
  return {
    profile: {
      ...profile,
      tdee: recalculation.tdee,
      dailyCalorieTarget: recalculation.dailyTarget,
      deficitKcal: recalculation.deficitKcal,
      goalTargetDate,
      updatedAt,
    },
    extras: {
      ...extras,
      currentWeightKg: newWeightKg,
    },
  };
}

export interface ProfileWithExtras {
  profile: UserProfile;
  extras: ProfileExtras;
}

export async function getProfileWithExtras(
  uid: string,
  db: Firestore = getFirestoreDb(),
): Promise<ProfileWithExtras | null> {
  const docData = await getProfileDoc(uid, db);
  if (!docData) {
    return null;
  }
  const reminderPrefs = resolveReminderPrefs(docData);
  return {
    profile: docToProfile(docData, uid),
    extras: {
      onboardingCompleted: docData.onboardingCompleted,
      useLbsForWeight: docData.useLbsForWeight,
      useImperialForHeight: docData.useImperialForHeight,
      currentWeightKg: docData.currentWeightKg,
      ...reminderPrefs,
    },
  };
}
