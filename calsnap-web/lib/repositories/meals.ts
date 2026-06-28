import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import type { MealEntry } from '@/lib/models/meal-entry';
import {
  mealDocToEntry,
  type MealEntryDoc,
} from '@/lib/models/meal-entry-doc';
import { calendarDayRange } from '@/lib/dashboard/date-window';

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
