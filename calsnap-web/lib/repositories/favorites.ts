import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import type { MealEntry } from '@/lib/models/meal-entry';
import {
  autoFavoriteName,
  favoriteEntryToDoc,
  favoriteDocToEntry,
} from '@/lib/models/favorite-meal-doc';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { mapValidFirestoreDocs } from '@/lib/models/validate-doc';

export async function fetchFavorites(
  uid: string,
  db: Firestore = getFirestoreDb(),
): Promise<FavoriteMeal[]> {
  const ref = collection(db, 'users', uid, 'favorites');
  const snapshot = await getDocs(ref);
  const result = mapValidFirestoreDocs(
    snapshot.docs,
    'favorites',
    (docId, raw) => favoriteDocToEntry(docId, raw),
  );
  result.sort((a, b) => {
    const useDiff = (b.useCount ?? 0) - (a.useCount ?? 0);
    if (useDiff !== 0) return useDiff;
    const lastA = a.lastUsedAt?.getTime() ?? 0;
    const lastB = b.lastUsedAt?.getTime() ?? 0;
    if (lastB !== lastA) return lastB - lastA;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  return result;
}

export async function logFavorite(
  uid: string,
  favoriteId: string,
  db: Firestore = getFirestoreDb(),
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'favorites', favoriteId);
  const now = Timestamp.fromDate(new Date());
  await updateDoc(docRef, {
    useCount: increment(1),
    lastUsedAt: now,
    updatedAt: now,
  });
}

export async function saveFavorite(
  uid: string,
  meal: MealEntry,
  db: Firestore = getFirestoreDb(),
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  const entry: FavoriteMeal = {
    id,
    userId: uid,
    originalMealId: meal.id,
    name: autoFavoriteName(meal.items),
    mealType: meal.mealType,
    totalCalories: meal.totalCalories,
    totalProteinG: meal.totalProteinG,
    totalCarbsG: meal.totalCarbsG,
    totalFatG: meal.totalFatG,
    totalFiberG: meal.totalFiberG,
    items: meal.items,
    useCount: 0,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = doc(db, 'users', uid, 'favorites', id);
  await setDoc(docRef, favoriteEntryToDoc(entry));
  return id;
}

export async function updateFavoriteName(
  uid: string,
  favoriteId: string,
  name: string,
  db: Firestore = getFirestoreDb(),
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'favorites', favoriteId);
  await updateDoc(docRef, { name, updatedAt: Timestamp.fromDate(new Date()) });
}

export async function deleteFavorite(
  uid: string,
  favoriteId: string,
  db: Firestore = getFirestoreDb(),
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'favorites', favoriteId);
  await deleteDoc(docRef);
}
