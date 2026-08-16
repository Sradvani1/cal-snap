import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type Firestore,
} from 'firebase/firestore';
import { AppConstants } from '@/lib/constants';
import { getFirestoreDb } from '@/lib/firebase/client';
import type { WeighIn } from '@/lib/models/weigh-in';
import { selectPlateauWeighIns } from '@/lib/progress/progress-stats';
import {
  weighInDocToEntry,
} from '@/lib/models/weigh-in-doc';
import { mapValidFirestoreDocs } from '@/lib/models/validate-doc';

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
  const recent = mapValidFirestoreDocs(
    snapshot.docs,
    'weighIns',
    (docId, raw) => weighInDocToEntry(docId, raw),
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
    limit(5),
  );

  const snapshot = await getDocs(latestQuery);
  return mapValidFirestoreDocs(
    snapshot.docs,
    'weighIns',
    (docId, raw) => weighInDocToEntry(docId, raw),
  )[0];
}

export async function fetchAllWeighIns(
  uid: string,
  sortDescending = true,
  db: Firestore = getFirestoreDb(),
  maxCount?: number,
): Promise<WeighIn[]> {
  const weighInsRef = collection(db, 'users', uid, 'weighIns');
  const weighInsQuery = query(
    weighInsRef,
    orderBy('date', sortDescending ? 'desc' : 'asc'),
    ...(maxCount && maxCount > 0 ? [limit(maxCount)] : []),
  );

  const snapshot = await getDocs(weighInsQuery);
  return mapValidFirestoreDocs(
    snapshot.docs,
    'weighIns',
    (docId, raw) => weighInDocToEntry(docId, raw),
  );
}
