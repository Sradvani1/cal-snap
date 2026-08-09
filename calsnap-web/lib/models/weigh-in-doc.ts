import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import type { WeighIn } from '@/lib/models/weigh-in';
import { parseFirestoreDoc } from '@/lib/models/validate-doc';

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

const finiteNumber = z.number().finite();

export const weighInDocSchema = z.object({
  userId: z.string(),
  date: z.instanceof(Timestamp),
  weightKg: finiteNumber,
  calculatedTDEE: finiteNumber.optional(),
  adjustedDailyTarget: finiteNumber.optional(),
  bmi: finiteNumber.optional(),
  source: z.enum(['manual']).optional(),
  createdAt: z.instanceof(Timestamp),
});

export function parseWeighInDoc(id: string, raw: unknown): WeighInDoc {
  return parseFirestoreDoc(weighInDocSchema, 'weighIns', id, raw);
}

export function weighInDocToEntry(id: string, raw: unknown): WeighIn {
  const doc = parseWeighInDoc(id, raw);
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
