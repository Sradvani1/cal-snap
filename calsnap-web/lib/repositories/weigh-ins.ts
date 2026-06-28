import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore';
import { AppConstants } from '@/lib/constants';
import { daysBetween, startOfLocalDay } from '@/lib/dashboard/date-window';
import { getFirestoreDb } from '@/lib/firebase/client';
import type { WeighIn } from '@/lib/models/weigh-in';
import {
  weighInDocToEntry,
  type WeighInDoc,
} from '@/lib/models/weigh-in-doc';

export function docToWeighIn(id: string, doc: WeighInDoc): WeighIn {
  return weighInDocToEntry(id, doc);
}

export async function fetchWeighInsInWindow(
  uid: string,
  start: Date,
  end: Date,
  db: Firestore = getFirestoreDb(),
): Promise<WeighIn[]> {
  const windowStart = startOfLocalDay(start);
  const mealsRef = collection(db, 'users', uid, 'weighIns');
  const weighInsQuery = query(
    mealsRef,
    where('date', '>=', Timestamp.fromDate(windowStart)),
    where('date', '<', Timestamp.fromDate(end)),
    orderBy('date'),
  );

  const snapshot = await getDocs(weighInsQuery);
  return snapshot.docs.map((docSnap) =>
    docToWeighIn(docSnap.id, docSnap.data() as WeighInDoc),
  );
}

export async function fetchWeeklyPlateauWeighIns(
  uid: string,
  count: number = AppConstants.Plateau.weeksToDetect,
  minimumDaySpacing: number = AppConstants.Plateau.weeklyMinimumDaySpacing,
  db: Firestore = getFirestoreDb(),
): Promise<WeighIn[]> {
  if (count <= 0) {
    return [];
  }

  const weighInsRef = collection(db, 'users', uid, 'weighIns');
  const recentQuery = query(
    weighInsRef,
    orderBy('date', 'desc'),
    limit(count * 4),
  );
  const snapshot = await getDocs(recentQuery);
  const recent = snapshot.docs.map((docSnap) =>
    docToWeighIn(docSnap.id, docSnap.data() as WeighInDoc),
  );

  if (recent.length === 0) {
    return [];
  }

  const selected: WeighIn[] = [];
  let lastDate: Date | undefined;

  for (const weighIn of recent) {
    if (lastDate) {
      const days = daysBetween(weighIn.date, lastDate);
      if (days < minimumDaySpacing) {
        continue;
      }
    }
    selected.unshift(weighIn);
    lastDate = weighIn.date;
    if (selected.length === count) {
      break;
    }
  }

  return selected;
}

export async function fetchAllWeighIns(
  uid: string,
  sortDescending = true,
  db: Firestore = getFirestoreDb(),
): Promise<WeighIn[]> {
  const weighInsRef = collection(db, 'users', uid, 'weighIns');
  const weighInsQuery = query(
    weighInsRef,
    orderBy('date', sortDescending ? 'desc' : 'asc'),
  );

  const snapshot = await getDocs(weighInsQuery);
  return snapshot.docs.map((docSnap) =>
    docToWeighIn(docSnap.id, docSnap.data() as WeighInDoc),
  );
}
