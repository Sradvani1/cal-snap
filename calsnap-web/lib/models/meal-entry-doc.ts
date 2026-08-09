import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import { foodItemDocToEntry, foodItemToDoc } from '@/lib/models/food-item-doc';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealType } from '@/lib/models/meal-type';
import { parseFirestoreDoc } from '@/lib/models/validate-doc';

const finiteNumber = z.number().finite();

export const foodItemDocSchema = z.object({
  id: z.string(),
  name: z.string(),
  estimatedWeightG: finiteNumber,
  calories: finiteNumber,
  proteinG: finiteNumber,
  carbsG: finiteNumber,
  fatG: finiteNumber,
  saturatedFatG: finiteNumber,
  unsaturatedFatG: finiteNumber,
  fiberG: finiteNumber,
  confidence: finiteNumber,
  usdaFoodId: z.string().optional(),
  isFlagged: z.boolean(),
});

export const mealEntryDocSchema = z.object({
  userId: z.string(),
  timestamp: z.instanceof(Timestamp),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  photoStoragePath: z.string().optional(),
  textDescription: z.string().optional(),
  totalCalories: finiteNumber,
  totalProteinG: finiteNumber,
  totalCarbsG: finiteNumber,
  totalFatG: finiteNumber,
  totalSaturatedFatG: finiteNumber,
  totalUnsaturatedFatG: finiteNumber,
  totalFiberG: finiteNumber,
  geminiConfidence: finiteNumber,
  isManuallyAdjusted: z.boolean(),
  estimationNotes: z.string().optional(),
  items: z.array(foodItemDocSchema),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

export interface FoodItemDoc {
  id: string;
  name: string;
  estimatedWeightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  unsaturatedFatG: number;
  fiberG: number;
  confidence: number;
  usdaFoodId?: string;
  isFlagged: boolean;
}

/** Firestore document at `users/{uid}/meals/{mealId}`. */
export interface MealEntryDoc {
  userId: string;
  timestamp: Timestamp;
  mealType: MealType;
  photoStoragePath?: string;
  textDescription?: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalSaturatedFatG: number;
  totalUnsaturatedFatG: number;
  totalFiberG: number;
  geminiConfidence: number;
  isManuallyAdjusted: boolean;
  estimationNotes?: string;
  items: FoodItemDoc[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function parseMealEntryDoc(id: string, raw: unknown): MealEntryDoc {
  return parseFirestoreDoc(mealEntryDocSchema, 'meals', id, raw);
}

export function mealEntryDocToEntry(id: string, doc: MealEntryDoc): MealEntry {
  return {
    id,
    userId: doc.userId,
    timestamp: doc.timestamp.toDate(),
    mealType: doc.mealType,
    photoStoragePath: doc.photoStoragePath,
    textDescription: doc.textDescription,
    totalCalories: doc.totalCalories,
    totalProteinG: doc.totalProteinG,
    totalCarbsG: doc.totalCarbsG,
    totalFatG: doc.totalFatG,
    totalSaturatedFatG: doc.totalSaturatedFatG,
    totalUnsaturatedFatG: doc.totalUnsaturatedFatG,
    totalFiberG: doc.totalFiberG,
    geminiConfidence: doc.geminiConfidence,
    isManuallyAdjusted: doc.isManuallyAdjusted,
    estimationNotes: doc.estimationNotes,
    items: doc.items.map(foodItemDocToEntry),
  };
}

export function mealDocToEntry(id: string, raw: unknown): MealEntry {
  return mealEntryDocToEntry(id, parseMealEntryDoc(id, raw));
}

export function mealEntryToDoc(entry: MealEntry, createdAt?: Timestamp): MealEntryDoc {
  const now = Timestamp.fromDate(new Date());
  return {
    userId: entry.userId,
    timestamp: Timestamp.fromDate(entry.timestamp),
    mealType: entry.mealType,
    totalCalories: entry.totalCalories,
    totalProteinG: entry.totalProteinG,
    totalCarbsG: entry.totalCarbsG,
    totalFatG: entry.totalFatG,
    totalSaturatedFatG: entry.totalSaturatedFatG,
    totalUnsaturatedFatG: entry.totalUnsaturatedFatG,
    totalFiberG: entry.totalFiberG,
    geminiConfidence: entry.geminiConfidence,
    isManuallyAdjusted: entry.isManuallyAdjusted,
    items: entry.items.map(foodItemToDoc),
    createdAt: createdAt ?? now,
    updatedAt: now,
    ...(entry.photoStoragePath !== undefined ? { photoStoragePath: entry.photoStoragePath } : {}),
    ...(entry.textDescription !== undefined ? { textDescription: entry.textDescription } : {}),
    ...(entry.estimationNotes !== undefined ? { estimationNotes: entry.estimationNotes } : {}),
  };
}

