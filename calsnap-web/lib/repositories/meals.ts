import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirestoreDb, getFirebaseStorage } from '@/lib/firebase/client';
import type { MealEntry } from '@/lib/models/meal-entry';
import {
  mealDocToEntry,
  mealEntryToDoc,
  type MealEntryDoc,
} from '@/lib/models/meal-entry-doc';
import { calendarDayRange, endOfLocalDayExclusive, startOfLocalDay } from '@/lib/dashboard/date-window';
import { MealNotFoundError } from '@/lib/repositories/meal-errors';

export function mealPhotoStoragePath(uid: string, mealId: string): string {
  return `users/${uid}/meals/${mealId}/photo.jpg`;
}

export async function uploadMealPhoto(
  uid: string,
  mealId: string,
  blob: Blob,
): Promise<string> {
  const path = mealPhotoStoragePath(uid, mealId);
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return path;
}

export async function createMeal(
  entry: MealEntry,
  db: Firestore = getFirestoreDb(),
): Promise<string> {
  const docRef = doc(db, 'users', entry.userId, 'meals', entry.id);
  await setDoc(docRef, mealEntryToDoc(entry));
  return entry.id;
}

export async function fetchMealsForCalendarDay(
  uid: string,
  day: Date,
  db: Firestore = getFirestoreDb(),
): Promise<MealEntry[]> {
  const { start, end } = calendarDayRange(day);
  const mealsRef = collection(db, 'users', uid, 'meals');
  const mealsQuery = query(
    mealsRef,
    where('timestamp', '>=', Timestamp.fromDate(start)),
    where('timestamp', '<', Timestamp.fromDate(end)),
    orderBy('timestamp'),
  );

  const snapshot = await getDocs(mealsQuery);
  return snapshot.docs.map((docSnap) =>
    mealDocToEntry(docSnap.id, docSnap.data() as MealEntryDoc),
  );
}

export async function fetchMealsInRange(
  uid: string,
  rangeStart: Date,
  rangeEndInclusive: Date,
  db: Firestore = getFirestoreDb(),
): Promise<MealEntry[]> {
  const start = startOfLocalDay(rangeStart);
  const end = endOfLocalDayExclusive(rangeEndInclusive);
  const mealsRef = collection(db, 'users', uid, 'meals');
  const mealsQuery = query(
    mealsRef,
    where('timestamp', '>=', Timestamp.fromDate(start)),
    where('timestamp', '<', Timestamp.fromDate(end)),
    orderBy('timestamp'),
  );

  const snapshot = await getDocs(mealsQuery);
  return snapshot.docs.map((docSnap) =>
    mealDocToEntry(docSnap.id, docSnap.data() as MealEntryDoc),
  );
}

export interface FetchedMeal {
  entry: MealEntry;
  createdAt: Timestamp;
}

export async function fetchMeal(
  uid: string,
  mealId: string,
  db: Firestore = getFirestoreDb(),
): Promise<FetchedMeal> {
  const docRef = doc(db, 'users', uid, 'meals', mealId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    throw new MealNotFoundError(mealId);
  }
  const data = snapshot.data() as MealEntryDoc;
  return {
    entry: mealDocToEntry(snapshot.id, data),
    createdAt: data.createdAt,
  };
}

export async function updateMeal(
  entry: MealEntry,
  db: Firestore = getFirestoreDb(),
): Promise<void> {
  const docRef = doc(db, 'users', entry.userId, 'meals', entry.id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    throw new MealNotFoundError(entry.id);
  }
  const data = snapshot.data() as MealEntryDoc;
  await setDoc(docRef, mealEntryToDoc(entry, data.createdAt));
}

export async function deleteMeal(
  uid: string,
  mealId: string,
  db: Firestore = getFirestoreDb(),
): Promise<MealEntry> {
  const docRef = doc(db, 'users', uid, 'meals', mealId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    throw new MealNotFoundError(mealId);
  }

  const entry = mealDocToEntry(snapshot.id, snapshot.data() as MealEntryDoc);
  await deleteDoc(docRef);

  if (entry.photoStoragePath) {
    await deleteMealPhoto(entry.photoStoragePath);
  }

  return entry;
}

export async function deleteMealPhoto(path: string): Promise<void> {
  try {
    const storageRef = ref(getFirebaseStorage(), path);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Failed to delete meal photo from Storage:', error);
  }
}

export async function getMealPhotoDownloadUrl(path: string): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path);
  return getDownloadURL(storageRef);
}

export async function fetchAllMeals(
  uid: string,
  sortAscending = true,
  db: Firestore = getFirestoreDb(),
): Promise<MealEntry[]> {
  const mealsRef = collection(db, 'users', uid, 'meals');
  const mealsQuery = query(
    mealsRef,
    orderBy('timestamp', sortAscending ? 'asc' : 'desc'),
  );

  const snapshot = await getDocs(mealsQuery);
  return snapshot.docs.map((docSnap) =>
    mealDocToEntry(docSnap.id, docSnap.data() as MealEntryDoc),
  );
}
