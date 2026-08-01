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
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { getFirestoreDb } from '@/lib/firebase/client';
import type { WeighIn } from '@/lib/models/weigh-in';
import { selectPlateauWeighIns } from '@/lib/progress/progress-stats';
import {
  weighInDocToEntry,
  type WeighInDoc,
} from '@/lib/models/weigh-in-doc';

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
    weighInDocToEntry(docSnap.id, docSnap.data() as WeighInDoc),
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
    weighInDocToEntry(docSnap.id, docSnap.data() as WeighInDoc),
  );

  return selectPlateauWeighIns(recent, count, minimumDaySpacing);
}

export async function fetchLatestWeighIn(
  uid: string,
  db: Firestore = getFirestoreDb(),
): Promise<WeighIn | undefined> {
  const weighInsRef = collection(db, 'users', uid, 'weighIns');
  const latestQuery = query(
    weighInsRef,
    orderBy('date', 'desc'),
    limit(1),
  );

  const snapshot = await getDocs(latestQuery);
  const docSnap = snapshot.docs[0];
  return docSnap
    ? weighInDocToEntry(docSnap.id, docSnap.data() as WeighInDoc)
    : undefined;
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
    weighInDocToEntry(docSnap.id, docSnap.data() as WeighInDoc),
  );
}
