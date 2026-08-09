/**
 * Optional integration test — run with Firestore + Auth emulators:
 *
 *   pnpm test:integration
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import type { MealEntryDoc } from '@/lib/models/meal-entry-doc';
import type { WeighInDoc } from '@/lib/models/weigh-in-doc';
import { fetchMealsForCalendarDay } from '@/lib/repositories/meals';
import {
  fetchAllWeighIns,
  fetchLatestWeighIn,
  fetchWeeklyPlateauWeighIns,
} from '@/lib/repositories/weigh-ins';
import { selectPlateauWeighIns } from '@/lib/progress/progress-stats';

let testEnv: RulesTestEnvironment;

describe('dashboard Firestore reads', () => {
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

  it('fetchMealsForCalendarDay returns sorted meals for today', async () => {
    const uid = 'dashboard-meals-user';
    const alice = testEnv.authenticatedContext(uid);
    const db = alice.firestore();
    const today = startOfLocalDay(new Date());
    const later = new Date(today);
    later.setHours(12, 0, 0, 0);
    const earlier = new Date(today);
    earlier.setHours(8, 0, 0, 0);

    const baseDoc = (timestamp: Date, calories: number): MealEntryDoc => ({
      userId: uid,
      timestamp: Timestamp.fromDate(timestamp),
      mealType: 'lunch',
      totalCalories: calories,
      totalProteinG: 20,
      totalCarbsG: 30,
      totalFatG: 10,
      totalSaturatedFatG: 0,
      totalUnsaturatedFatG: 0,
      totalFiberG: 4,
      geminiConfidence: 0.9,
      isManuallyAdjusted: false,
      items: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await setDoc(doc(db, 'users', uid, 'meals', 'meal-late'), baseDoc(later, 600));
    await setDoc(doc(db, 'users', uid, 'meals', 'meal-early'), baseDoc(earlier, 400));
    await setDoc(doc(db, 'users', uid, 'meals', 'meal-yesterday'), {
      ...baseDoc(new Date(today.getTime() - 86_400_000), 500),
    });

    const meals = await fetchMealsForCalendarDay(uid, today, db);

    expect(meals).toHaveLength(2);
    expect(meals.map((meal) => meal.totalCalories)).toEqual([400, 600]);
  });

  it('skips malformed meals and warns without rejecting the day read', async () => {
    const uid = 'dashboard-malformed-meal-user';
    const db = testEnv.authenticatedContext(uid).firestore();
    const today = startOfLocalDay(new Date());
    const baseDoc = (timestamp: Date, calories: number): MealEntryDoc => ({
      userId: uid,
      timestamp: Timestamp.fromDate(timestamp),
      mealType: 'lunch',
      totalCalories: calories,
      totalProteinG: 20,
      totalCarbsG: 30,
      totalFatG: 10,
      totalSaturatedFatG: 0,
      totalUnsaturatedFatG: 0,
      totalFiberG: 4,
      geminiConfidence: 0.9,
      isManuallyAdjusted: false,
      items: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await setDoc(doc(db, 'users', uid, 'meals', 'valid'), baseDoc(today, 400));
    const malformed = { ...baseDoc(today, 500) } as Record<string, unknown>;
    delete malformed.totalSaturatedFatG;
    await setDoc(doc(db, 'users', uid, 'meals', 'malformed'), malformed);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const meals = await fetchMealsForCalendarDay(uid, today, db);

      expect(meals.map((meal) => meal.totalCalories)).toEqual([400]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping malformed meals doc malformed'),
        expect.any(Error),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('fetchWeeklyPlateauWeighIns returns weekly-spaced entries', async () => {
    const uid = 'dashboard-weighins-user';
    const alice = testEnv.authenticatedContext(uid);
    const db = alice.firestore();
    const today = startOfLocalDay(new Date());

    const makeWeighIn = (daysAgo: number, weightKg: number): WeighInDoc => ({
      userId: uid,
      date: Timestamp.fromDate(new Date(today.getTime() - daysAgo * 86_400_000)),
      weightKg,
      createdAt: Timestamp.now(),
    });

    await setDoc(doc(db, 'users', uid, 'weighIns', 'w0'), makeWeighIn(0, 80));
    await setDoc(doc(db, 'users', uid, 'weighIns', 'w1'), makeWeighIn(7, 80.05));
    await setDoc(doc(db, 'users', uid, 'weighIns', 'w2'), makeWeighIn(14, 80.1));
    await setDoc(doc(db, 'users', uid, 'weighIns', 'w3'), makeWeighIn(15, 80.2));

    const plateauWeighIns = await fetchWeeklyPlateauWeighIns(uid, 3, 6, db);

    expect(plateauWeighIns).toHaveLength(3);
    expect(plateauWeighIns.map((entry) => entry.weightKg)).toEqual([80.1, 80.05, 80]);
  });

  it('fetchLatestWeighIn returns the most recent weigh-in', async () => {
    const uid = 'dashboard-latest-weighin-user';
    const alice = testEnv.authenticatedContext(uid);
    const db = alice.firestore();
    const today = startOfLocalDay(new Date());

    const makeWeighIn = (daysAgo: number, weightKg: number): WeighInDoc => ({
      userId: uid,
      date: Timestamp.fromDate(new Date(today.getTime() - daysAgo * 86_400_000)),
      weightKg,
      createdAt: Timestamp.now(),
    });

    await setDoc(doc(db, 'users', uid, 'weighIns', 'old'), makeWeighIn(30, 82));
    await setDoc(doc(db, 'users', uid, 'weighIns', 'newer'), makeWeighIn(1, 79.5));

    const latest = await fetchLatestWeighIn(uid, db);

    expect(latest?.id).toBe('newer');
    expect(latest?.weightKg).toBe(79.5);
  });

  it('fetchLatestWeighIn returns undefined when there are no weigh-ins', async () => {
    const uid = 'dashboard-empty-weighin-user';
    const alice = testEnv.authenticatedContext(uid);
    const db = alice.firestore();

    expect(await fetchLatestWeighIn(uid, db)).toBeUndefined();
  });

  it('throws when the returned latest weigh-in is malformed', async () => {
    const uid = 'dashboard-malformed-latest-user';
    const db = testEnv.authenticatedContext(uid).firestore();
    const today = startOfLocalDay(new Date());

    await setDoc(doc(db, 'users', uid, 'weighIns', 'malformed'), {
      userId: uid,
      date: Timestamp.fromDate(today),
      createdAt: Timestamp.now(),
    });

    await expect(fetchLatestWeighIn(uid, db)).rejects.toThrow(
      'Invalid Firestore document weighIns/malformed',
    );
  });

  it('skips malformed weigh-ins in list reads', async () => {
    const uid = 'dashboard-malformed-weighin-user';
    const db = testEnv.authenticatedContext(uid).firestore();
    const today = startOfLocalDay(new Date());

    await setDoc(doc(db, 'users', uid, 'weighIns', 'valid'), {
      userId: uid,
      date: Timestamp.fromDate(today),
      weightKg: 80,
      createdAt: Timestamp.now(),
    });
    await setDoc(doc(db, 'users', uid, 'weighIns', 'malformed'), {
      userId: uid,
      date: Timestamp.fromDate(new Date(today.getTime() - 86_400_000)),
      createdAt: Timestamp.now(),
    });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const weighIns = await fetchAllWeighIns(uid, true, db);

      expect(weighIns.map((weighIn) => weighIn.id)).toEqual(['valid']);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping malformed weighIns doc malformed'),
        expect.any(Error),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('selectPlateauWeighIns over fetchAllWeighIns matches fetchWeeklyPlateauWeighIns', async () => {
    const uid = 'dashboard-plateau-equivalence-user';
    const alice = testEnv.authenticatedContext(uid);
    const db = alice.firestore();
    const today = startOfLocalDay(new Date());

    const makeWeighIn = (daysAgo: number, weightKg: number): WeighInDoc => ({
      userId: uid,
      date: Timestamp.fromDate(new Date(today.getTime() - daysAgo * 86_400_000)),
      weightKg,
      createdAt: Timestamp.now(),
    });

    await setDoc(doc(db, 'users', uid, 'weighIns', 'w0'), makeWeighIn(0, 80));
    await setDoc(doc(db, 'users', uid, 'weighIns', 'w1'), makeWeighIn(7, 80.05));
    await setDoc(doc(db, 'users', uid, 'weighIns', 'w2'), makeWeighIn(14, 80.1));
    await setDoc(doc(db, 'users', uid, 'weighIns', 'w3'), makeWeighIn(15, 80.2));

    const direct = await fetchWeeklyPlateauWeighIns(uid, 3, 6, db);
    const all = await fetchAllWeighIns(uid, true, db);
    const derived = selectPlateauWeighIns(all.slice(0, 3 * 4), 3, 6);

    expect(derived.map((entry) => entry.id)).toEqual(direct.map((entry) => entry.id));
  });
});
