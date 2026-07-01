import { expect, type Page } from '@playwright/test';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { copy } from '@/lib/copy';
import type { MealEntry } from '@/lib/models/meal-entry';
import { createMeal } from '@/lib/repositories/meals';

const EMULATOR_FIREBASE_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-calsnap.firebaseapp.com',
  projectId: 'demo-calsnap',
  storageBucket: 'demo-calsnap.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef',
} as const;

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;

let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;
let e2eAuth: Auth | undefined;
let e2eDb: Firestore | undefined;

function getE2eFirebaseApp(): FirebaseApp {
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(EMULATOR_FIREBASE_CONFIG);
}

function getE2eAuth(): Auth {
  if (e2eAuth) {
    return e2eAuth;
  }

  const app = getE2eFirebaseApp();
  try {
    e2eAuth = initializeAuth(app, { persistence: inMemoryPersistence });
  } catch {
    e2eAuth = getAuth(app);
  }

  if (!authEmulatorConnected) {
    connectAuthEmulator(e2eAuth, AUTH_EMULATOR_URL, { disableWarnings: true });
    authEmulatorConnected = true;
  }

  return e2eAuth;
}

function getE2eFirestore(): Firestore {
  if (e2eDb) {
    return e2eDb;
  }

  const app = getE2eFirebaseApp();
  e2eDb = getFirestore(app);

  if (!firestoreEmulatorConnected) {
    connectFirestoreEmulator(e2eDb, FIRESTORE_HOST, FIRESTORE_PORT);
    firestoreEmulatorConnected = true;
  }

  return e2eDb;
}

function localNoonDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function makeMealEntry(uid: string, id: string, timestamp: Date): MealEntry {
  return {
    id,
    userId: uid,
    timestamp,
    mealType: 'lunch',
    totalCalories: 500,
    totalProteinG: 30,
    totalCarbsG: 40,
    totalFatG: 15,
    totalFiberG: 5,
    geminiConfidence: 0.9,
    isManuallyAdjusted: false,
    items: [],
  };
}

export async function seedMealsOnDistinctDays(
  credentials: { email: string; password: string },
  dayCount: number,
): Promise<void> {
  const auth = getE2eAuth();
  const db = getE2eFirestore();
  const { user } = await signInWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password,
  );

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    await createMeal(
      makeMealEntry(user.uid, `e2e-analytics-meal-${dayIndex}`, localNoonDaysAgo(dayIndex)),
      db,
    );
  }
}

export async function gotoAnalyticsFromProgress(page: Page): Promise<void> {
  await page.getByRole('link', { name: copy('common.nav.progress') }).click();
  await expect(page).toHaveURL(/\/progress/);
  await page.getByRole('link', { name: copy('progress.link.analytics') }).click();
  await expect(page).toHaveURL(/\/analytics/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: copy('analytics.title') })).toBeVisible();
}

export async function expectAnalyticsEmptyState(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { name: copy('analytics.empty.title'), level: 3 }),
  ).toBeVisible({ timeout: 15_000 });
  const scanCta = page
    .getByRole('link', { name: copy('designSystem.emptyState.actionHint') })
    .filter({ hasText: copy('analytics.empty.action') });
  await expect(scanCta).toBeVisible({ timeout: 15_000 });
}

export async function expectAnalyticsDietarySections(page: Page): Promise<void> {
  const sectionTitles = [
    copy('analytics.section.calorieAdherence'),
    copy('analytics.section.macroTrends'),
    copy('analytics.section.fiber'),
    copy('analytics.section.patterns'),
  ];

  for (const title of sectionTitles) {
    await expect(page.getByRole('heading', { name: title, level: 2 })).toBeVisible({
      timeout: 15_000,
    });
  }
}

export async function expectGenerateInsightUnavailable(page: Page): Promise<void> {
  const generateButton = page.getByRole('button', { name: copy('analytics.insight.generate') });
  await expect(generateButton).toHaveCount(0);
}
