import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { getFirestoreDb, getFirebaseStorage } from '@/lib/firebase/client';
import type { MealEntry } from '@/lib/models/meal-entry';
import {
  mealDocToEntry,
  mealEntryToDoc,
  type MealEntryDoc,
} from '@/lib/models/meal-entry-doc';
import { calendarDayRange } from '@/lib/dashboard/date-window';

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

export function docToMealEntry(id: string, doc: MealEntryDoc): MealEntry {
  return mealDocToEntry(id, doc);
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
    docToMealEntry(docSnap.id, docSnap.data() as MealEntryDoc),
  );
}
