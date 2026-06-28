/**
 * Optional integration test — run with Firestore + Auth emulators:
 *
 *   pnpm test:integration
 *
 * Requires `firebase emulators:exec` (see package.json).
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
import { afterAll, beforeAll, describe, it } from 'vitest';
import type { ProfileDoc } from '@/lib/models/profile-doc';
import { PROFILE_DOC_ID } from '@/lib/models/profile-doc';

let testEnv: RulesTestEnvironment;

const sampleProfileDoc = (): ProfileDoc => ({
  name: 'Integration User',
  onboardingCompleted: true,
  sex: 'male',
  dateOfBirth: Timestamp.fromDate(new Date(1990, 0, 1)),
  heightCm: 178,
  startingWeightKg: 80,
  currentWeightKg: 80,
  goalWeightKg: 72,
  goalTargetDate: Timestamp.fromDate(new Date(2027, 0, 1)),
  activityLevel: 'moderatelyActive',
  dailyCalorieTarget: 2000,
  tdee: 2500,
  deficitKcal: 500,
  macroTargetProteinPct: 0.28,
  macroTargetCarbsPct: 0.47,
  macroTargetFatPct: 0.25,
  useLbsForWeight: true,
  useImperialForHeight: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

describe('profile Firestore rules', () => {
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

  it('allows owner read/write on profile doc', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();

    await assertSucceeds(
      setDoc(doc(db, 'users', 'alice', 'profile', PROFILE_DOC_ID), sampleProfileDoc()),
    );

    await assertSucceeds(getDoc(doc(db, 'users', 'alice', 'profile', PROFILE_DOC_ID)));
  });

  it('denies cross-uid write', async () => {
    const bob = testEnv.authenticatedContext('bob');
    const db = bob.firestore();

    await assertFails(
      setDoc(doc(db, 'users', 'alice', 'profile', PROFILE_DOC_ID), sampleProfileDoc()),
    );
  });
});
