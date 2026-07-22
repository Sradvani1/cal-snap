/**
 * Optional integration test — run with Firestore + Auth emulators:
 *
 *   pnpm test:integration
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import type { MealEntryDoc } from '@/lib/models/meal-entry-doc';
import type { WeighInDoc } from '@/lib/models/weigh-in-doc';
import { fetchMealsForCalendarDay } from '@/lib/repositories/meals';
import { fetchWeeklyPlateauWeighIns } from '@/lib/repositories/weigh-ins';

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
});
