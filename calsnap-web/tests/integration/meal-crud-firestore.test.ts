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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';
import { mealEntryToDoc } from '@/lib/models/meal-entry-doc';
import {
  createMeal,
  deleteMeal,
  fetchMeal,
  updateMeal,
} from '@/lib/repositories/meals';
import { MealNotFoundError } from '@/lib/repositories/meal-errors';

let testEnv: RulesTestEnvironment;

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  const now = new Date('2026-06-27T12:00:00');
  return {
    id: overrides.id ?? 'meal-crud-1',
    userId: overrides.userId ?? 'crud-user',
    timestamp: overrides.timestamp ?? now,
    mealType: overrides.mealType ?? 'lunch',
    totalCalories: overrides.totalCalories ?? 500,
    totalProteinG: overrides.totalProteinG ?? 30,
    totalCarbsG: overrides.totalCarbsG ?? 40,
    totalFatG: overrides.totalFatG ?? 15,
    totalSaturatedFatG: overrides.totalSaturatedFatG ?? 0,
    totalUnsaturatedFatG: overrides.totalUnsaturatedFatG ?? 0,
    totalFiberG: overrides.totalFiberG ?? 5,
    geminiConfidence: overrides.geminiConfidence ?? 0.9,
    isManuallyAdjusted: overrides.isManuallyAdjusted ?? false,
    items: overrides.items ?? [],
    ...overrides,
  };
}

describe('meal CRUD Firestore', () => {
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

  it('create → fetch → update → delete round-trip', async () => {
    const uid = 'meal-crud-user';
    const db = testEnv.authenticatedContext(uid).firestore();
    const entry = makeEntry({ userId: uid });

    await createMeal(entry, db);
    const fetched = await fetchMeal(uid, entry.id, db);
    expect(fetched.entry.totalCalories).toBe(500);

    const updated: MealEntry = {
      ...fetched.entry,
      totalCalories: 600,
      totalProteinG: 35,
    };
    await updateMeal(updated, db);

    const refetched = await fetchMeal(uid, entry.id, db);
    expect(refetched.entry.totalCalories).toBe(600);
    expect(refetched.createdAt).toEqual(fetched.createdAt);

    const deleted = await deleteMeal(uid, entry.id, db);
    expect(deleted.id).toBe(entry.id);

    await expect(fetchMeal(uid, entry.id, db)).rejects.toThrow(MealNotFoundError);
  });

  it('delete throws MealNotFoundError when missing', async () => {
    const uid = 'meal-crud-missing';
    const db = testEnv.authenticatedContext(uid).firestore();
    await expect(deleteMeal(uid, 'missing-meal', db)).rejects.toThrow(MealNotFoundError);
  });

  it('denies cross-uid write on meals', async () => {
    const bob = testEnv.authenticatedContext('bob');
    const db = bob.firestore();
    const entry = makeEntry({ userId: 'alice', id: 'alice-meal' });

    await assertFails(
      setDoc(doc(db, 'users', 'alice', 'meals', entry.id), mealEntryToDoc(entry)),
    );
  });

  it('denies cross-uid read on meals', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const aliceDb = alice.firestore();
    const entry = makeEntry({ userId: 'alice', id: 'alice-meal-read' });
    await assertSucceeds(
      setDoc(doc(aliceDb, 'users', 'alice', 'meals', entry.id), mealEntryToDoc(entry)),
    );

    const bob = testEnv.authenticatedContext('bob');
    const bobDb = bob.firestore();
    await assertFails(getDoc(doc(bobDb, 'users', 'alice', 'meals', entry.id)));
  });
});
