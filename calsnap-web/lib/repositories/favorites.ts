import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
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
  type FavoriteMealDoc,
} from '@/lib/models/favorite-meal-doc';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';

export async function fetchFavorites(
  uid: string,
  db: Firestore = getFirestoreDb(),
): Promise<FavoriteMeal[]> {
  const ref = collection(db, 'users', uid, 'favorites');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => favoriteDocToEntry(d.id, d.data() as FavoriteMealDoc));
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
