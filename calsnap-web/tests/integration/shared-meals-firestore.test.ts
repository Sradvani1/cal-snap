/**
 * Shared meal repository integration test — run with Firebase emulators:
 *
 *   pnpm test:integration
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp, updateDoc, type Firestore } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';
import {
  addSharedMealToLog,
  createSharedMeal,
  fetchSharedMeal,
  SharedMealUnavailableError,
} from '@/lib/repositories/shared-meals';

let testEnv: RulesTestEnvironment;

const DAY_MS = 24 * 60 * 60 * 1000;

// rules-unit-testing returns compat Firestore instances; the modular API used by the repository accepts them at runtime.
function dbFor(uid: string): Firestore {
  return testEnv.authenticatedContext(uid).firestore() as unknown as Firestore;
}

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: 'dinner-1',
    userId: 'alice-repo',
    timestamp: new Date('2026-06-27T19:00:00'),
    mealType: 'dinner',
    totalCalories: 500,
    totalProteinG: 30,
    totalCarbsG: 40,
    totalFatG: 15,
    totalSaturatedFatG: 0,
    totalUnsaturatedFatG: 0,
    totalFiberG: 5,
    geminiConfidence: 0.9,
    isManuallyAdjusted: false,
    items: [],
    ...overrides,
  };
}

describe('shared meal repository', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-calsnap',
      firestore: { rules: fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8') },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('reuses the link while the meal is unchanged and creates a new one after an edit', async () => {
    const alice = dbFor('alice-repo');
    const entry = makeEntry();

    const first = await createSharedMeal('alice-repo', entry, alice);
    expect(await createSharedMeal('alice-repo', entry, alice)).toBe(first);
    expect(await createSharedMeal('alice-repo', { ...entry, totalCalories: 900 }, alice)).not.toBe(first);
  });

  it('reuses a link regardless of property order, but not one with under a day left', async () => {
    const alice = dbFor('alice-order');
    const entry = makeEntry({ userId: 'alice-order' });
    const reordered = Object.fromEntries(Object.entries(entry).reverse()) as MealEntry;
    const first = await createSharedMeal('alice-order', entry, alice);
    expect(await createSharedMeal('alice-order', reordered, alice)).toBe(first);

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'sharedMeals', first), {
        expiresAt: Timestamp.fromMillis(Date.now() + DAY_MS / 2),
      });
    });
    expect(await createSharedMeal('alice-order', entry, alice)).not.toBe(first);
  });

  it('lets another user view a shared meal and add it to her log exactly once', async () => {
    const alice = dbFor('alice-add');
    const bob = dbFor('bob-add');
    const shareId = await createSharedMeal('alice-add', makeEntry({ userId: 'alice-add' }), alice);

    const view = await fetchSharedMeal('bob-add', shareId, bob);
    expect(view.entry.totalCalories).toBe(500);
    expect(view.entry.userId).toBe('');
    expect(view.addedMealId).toBeNull();

    const mealId = await addSharedMealToLog('bob-add', shareId, view.entry, bob);
    expect(mealId).toBe(`shared-${shareId}`);

    await updateDoc(doc(bob, 'users', 'bob-add', 'meals', mealId), { totalCalories: 42 });
    expect(await addSharedMealToLog('bob-add', shareId, view.entry, bob)).toBe(mealId);
    const kept = await getDoc(doc(bob, 'users', 'bob-add', 'meals', mealId));
    expect(kept.data()?.totalCalories).toBe(42);

    const after = await fetchSharedMeal('bob-add', shareId, bob);
    expect(after.addedMealId).toBe(mealId);
  });

  it('reports the added meal when the share has expired', async () => {
    const alice = dbFor('alice-expired');
    const bob = dbFor('bob-expired');
    const shareId = await createSharedMeal('alice-expired', makeEntry({ userId: 'alice-expired' }), alice);
    const mealId = await addSharedMealToLog(
      'bob-expired',
      shareId,
      (await fetchSharedMeal('bob-expired', shareId, bob)).entry,
      bob,
    );

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'sharedMeals', shareId), {
        expiresAt: Timestamp.fromMillis(Date.now() - 1000),
      });
    });

    const error = await fetchSharedMeal('bob-expired', shareId, bob).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SharedMealUnavailableError);
    expect((error as SharedMealUnavailableError).addedMealId).toBe(mealId);
  });

  it('removes the owner’s expired links when a new one is created', async () => {
    const alice = dbFor('alice-cleanup');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sharedMeals', 'old-share'), {
        ownerUid: 'alice-cleanup',
        expiresAt: Timestamp.fromMillis(Date.now() - DAY_MS),
        meal: {},
      });
    });

    await createSharedMeal('alice-cleanup', makeEntry({ userId: 'alice-cleanup' }), alice);

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      expect((await getDoc(doc(ctx.firestore(), 'sharedMeals', 'old-share'))).exists()).toBe(false);
    });
  });
});
