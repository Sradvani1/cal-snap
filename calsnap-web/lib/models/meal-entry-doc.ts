import { Timestamp } from 'firebase/firestore';
import type { FoodItem } from '@/lib/models/food-item';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealType } from '@/lib/models/meal-type';

export interface FoodItemDoc {
  id: string;
  name: string;
  estimatedWeightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
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
  totalFiberG: number;
  geminiConfidence: number;
  isManuallyAdjusted: boolean;
  estimationNotes?: string;
  items: FoodItemDoc[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function foodItemDocToEntry(doc: FoodItemDoc): FoodItem {
  return {
    id: doc.id,
    name: doc.name,
    estimatedWeightG: doc.estimatedWeightG,
    calories: doc.calories,
    proteinG: doc.proteinG,
    carbsG: doc.carbsG,
    fatG: doc.fatG,
    fiberG: doc.fiberG,
    confidence: doc.confidence,
    usdaFoodId: doc.usdaFoodId,
    isFlagged: doc.isFlagged,
  };
}

function foodItemToDoc(item: FoodItem): FoodItemDoc {
  return {
    id: item.id,
    name: item.name,
    estimatedWeightG: item.estimatedWeightG,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    isFlagged: item.isFlagged,
    ...(item.usdaFoodId !== undefined ? { usdaFoodId: item.usdaFoodId } : {}),
  };
}

export function mealDocToEntry(id: string, doc: MealEntryDoc): MealEntry {
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
    totalFiberG: doc.totalFiberG,
    geminiConfidence: doc.geminiConfidence,
    isManuallyAdjusted: doc.isManuallyAdjusted,
    estimationNotes: doc.estimationNotes,
    items: doc.items.map(foodItemDocToEntry),
  };
}

export function mealEntryToDoc(entry: MealEntry): MealEntryDoc {
  const now = Timestamp.fromDate(new Date());
  return {
    userId: entry.userId,
    timestamp: Timestamp.fromDate(entry.timestamp),
    mealType: entry.mealType,
    totalCalories: entry.totalCalories,
    totalProteinG: entry.totalProteinG,
    totalCarbsG: entry.totalCarbsG,
    totalFatG: entry.totalFatG,
    totalFiberG: entry.totalFiberG,
    geminiConfidence: entry.geminiConfidence,
    isManuallyAdjusted: entry.isManuallyAdjusted,
    items: entry.items.map(foodItemToDoc),
    createdAt: now,
    updatedAt: now,
    ...(entry.photoStoragePath !== undefined ? { photoStoragePath: entry.photoStoragePath } : {}),
    ...(entry.textDescription !== undefined ? { textDescription: entry.textDescription } : {}),
    ...(entry.estimationNotes !== undefined ? { estimationNotes: entry.estimationNotes } : {}),
  };
}

/** Update mapper — preserves `createdAt`, bumps `updatedAt`. */
export function mealEntryToUpdateDoc(
  entry: MealEntry,
  createdAt: Timestamp,
): MealEntryDoc {
  return {
    userId: entry.userId,
    timestamp: Timestamp.fromDate(entry.timestamp),
    mealType: entry.mealType,
    totalCalories: entry.totalCalories,
    totalProteinG: entry.totalProteinG,
    totalCarbsG: entry.totalCarbsG,
    totalFatG: entry.totalFatG,
    totalFiberG: entry.totalFiberG,
    geminiConfidence: entry.geminiConfidence,
    isManuallyAdjusted: entry.isManuallyAdjusted,
    items: entry.items.map(foodItemToDoc),
    createdAt,
    updatedAt: Timestamp.fromDate(new Date()),
    ...(entry.photoStoragePath !== undefined ? { photoStoragePath: entry.photoStoragePath } : {}),
    ...(entry.textDescription !== undefined ? { textDescription: entry.textDescription } : {}),
    ...(entry.estimationNotes !== undefined ? { estimationNotes: entry.estimationNotes } : {}),
  };
}
