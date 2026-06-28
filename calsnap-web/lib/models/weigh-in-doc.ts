import { Timestamp } from 'firebase/firestore';
import type { WeighIn } from '@/lib/models/weigh-in';

/** Firestore document at `users/{uid}/weighIns/{weighInId}`. */
export interface WeighInDoc {
  userId: string;
  date: Timestamp;
  weightKg: number;
  calculatedTDEE?: number;
  adjustedDailyTarget?: number;
  bmi?: number;
  source?: 'manual';
  createdAt: Timestamp;
}

export function weighInDocToEntry(id: string, doc: WeighInDoc): WeighIn {
  return {
    id,
    userId: doc.userId,
    date: doc.date.toDate(),
    weightKg: doc.weightKg,
    calculatedTDEE: doc.calculatedTDEE,
    adjustedDailyTarget: doc.adjustedDailyTarget,
    bmi: doc.bmi,
    source: doc.source,
    createdAt: doc.createdAt.toDate(),
  };
}

export function weighInToDoc(entry: WeighIn): WeighInDoc {
  return {
    userId: entry.userId,
    date: Timestamp.fromDate(entry.date),
    weightKg: entry.weightKg,
    calculatedTDEE: entry.calculatedTDEE,
    adjustedDailyTarget: entry.adjustedDailyTarget,
    bmi: entry.bmi,
    source: entry.source,
    createdAt: Timestamp.fromDate(entry.createdAt ?? new Date()),
  };
}
