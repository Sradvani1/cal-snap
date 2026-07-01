/**
 * Optional integration test — run with Firestore + Auth emulators:
 *
 *   pnpm test:integration
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ProfileDoc } from '@/lib/models/profile-doc';
import { PROFILE_DOC_ID } from '@/lib/models/profile-doc';
import { saveWeighIn, recalculateWeighIn } from '@/lib/services/weigh-in-service';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileExtras } from '@/lib/models/profile-doc';

let testEnv: RulesTestEnvironment;

function makeProfile(uid: string): UserProfile {
  const now = new Date('2026-06-27T12:00:00');
  return {
    id: uid,
    name: 'Alex',
    sex: 'male',
    dateOfBirth: new Date(1991, 5, 14),
    heightCm: 178,
    startingWeightKg: 80,
    goalWeightKg: 72,
    goalTargetDate: new Date(2026, 11, 27),
    activityLevel: 'moderatelyActive',
    dailyCalorieTarget: 2285,
    tdee: 2635,
    deficitKcal: 350,
    macroTargetProteinPct: 0.28,
    macroTargetCarbsPct: 0.47,
    macroTargetFatPct: 0.25,
    createdAt: now,
    updatedAt: now,
  };
}

function makeExtras(): ProfileExtras {
  return {
    onboardingCompleted: true,
    currentWeightKg: 80,
    useLbsForWeight: false,
    useImperialForHeight: false,
  };
}

function profileToSeedDoc(profile: UserProfile, extras: ProfileExtras): ProfileDoc {
  return {
    name: profile.name,
    onboardingCompleted: extras.onboardingCompleted,
    sex: profile.sex,
    dateOfBirth: Timestamp.fromDate(profile.dateOfBirth),
    heightCm: profile.heightCm,
    startingWeightKg: profile.startingWeightKg,
    currentWeightKg: extras.currentWeightKg,
    goalWeightKg: profile.goalWeightKg,
    goalTargetDate: Timestamp.fromDate(profile.goalTargetDate),
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
  };
}

describe('weigh-in Firestore batch save', () => {
  beforeAll(async () => {
    const rulesPath = path.join(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-calsnap',
      firestore: { rules },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('batch write updates profile currentWeightKg and creates weigh-in doc', async () => {
    const uid = 'weigh-in-save-user';
    const db = testEnv.authenticatedContext(uid).firestore();
    const profile = makeProfile(uid);
    const extras = makeExtras();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .doc(`users/${uid}/profile/${PROFILE_DOC_ID}`)
        .set(profileToSeedDoc(profile, extras));
    });

    const result = await saveWeighIn(
      {
        uid,
        profile,
        profileExtras: extras,
        newWeightKg: 78,
        date: new Date('2026-06-27T12:00:00'),
      },
      { db },
    );

    expect(result.weighIn.weightKg).toBe(78);
    const expected = recalculateWeighIn(profile, 78);
    expect(result.updatedProfile.tdee).toBe(expected.tdee);

    const profileSnap = await getDoc(doc(db, 'users', uid, 'profile', PROFILE_DOC_ID));
    const profileData = profileSnap.data() as ProfileDoc;
    expect(profileData.currentWeightKg).toBe(78);
    expect(profileData.tdee).toBe(result.updatedProfile.tdee);

    const weighInSnap = await getDoc(
      doc(db, 'users', uid, 'weighIns', result.weighIn.id),
    );
    expect(weighInSnap.exists()).toBe(true);
    expect(weighInSnap.data()?.weightKg).toBe(78);
    expect(weighInSnap.data()?.source).toBe('manual');
  });

  it('denies cross-uid write on weighIns', async () => {
    const bob = testEnv.authenticatedContext('bob');
    const db = bob.firestore();

    await assertFails(
      setDoc(doc(db, 'users', 'alice', 'weighIns', 'weigh-in-1'), {
        weightKg: 75,
        date: Timestamp.fromDate(new Date('2026-06-27T12:00:00')),
        source: 'manual',
        createdAt: Timestamp.now(),
      }),
    );
  });

  it('denies cross-uid read on weighIns', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const aliceDb = alice.firestore();
    await assertSucceeds(
      setDoc(doc(aliceDb, 'users', 'alice', 'weighIns', 'weigh-in-read'), {
        weightKg: 75,
        date: Timestamp.fromDate(new Date('2026-06-27T12:00:00')),
        source: 'manual',
        createdAt: Timestamp.now(),
      }),
    );

    const bob = testEnv.authenticatedContext('bob');
    const bobDb = bob.firestore();
    await assertFails(getDoc(doc(bobDb, 'users', 'alice', 'weighIns', 'weigh-in-read')));
  });
});
