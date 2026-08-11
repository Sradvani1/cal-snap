import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import type { FoodItem } from '@/lib/models/food-item';
import { foodItemToDoc, foodItemDocToEntry } from '@/lib/models/food-item-doc';
import { foodItemDocSchema, type FoodItemDoc } from '@/lib/models/meal-entry-doc';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import type { MealType } from '@/lib/models/meal-type';
import { parseFirestoreDoc } from '@/lib/models/validate-doc';

export interface FavoriteMealDoc {
  userId: string;
  originalMealId: string;
  name: string;
  mealType: MealType;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  items: FoodItemDoc[];
  useCount: number;
  lastUsedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const finiteNumber = z.number().finite();

export const favoriteMealDocSchema = z.object({
  userId: z.string(),
  originalMealId: z.string(),
  name: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  totalCalories: finiteNumber,
  totalProteinG: finiteNumber,
  totalCarbsG: finiteNumber,
  totalFatG: finiteNumber,
  totalFiberG: finiteNumber,
  items: z.array(foodItemDocSchema),
  useCount: finiteNumber,
  lastUsedAt: z.instanceof(Timestamp).nullable(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

export function autoFavoriteName(items: FoodItem[]): string {
  const nonEmpty = items.filter((i) => i.name.length > 0);
  if (nonEmpty.length === 0) return 'Meal';
  const names = nonEmpty.slice(0, 3).map((i) => i.name);
  const base = names.join(', ');
  const extra = items.length - 3;
  const suffix = extra > 0 ? ` & ${extra} more` : '';
  const full = `${base}${suffix}`;
  return full.length > 40 ? `${full.slice(0, 37)}...` : full;
}

export function parseFavoriteMealDoc(id: string, raw: unknown): FavoriteMealDoc {
  return parseFirestoreDoc(favoriteMealDocSchema, 'favorites', id, raw);
}

export function favoriteDocToEntry(id: string, raw: unknown): FavoriteMeal {
  const doc = parseFavoriteMealDoc(id, raw);
  return {
    id,
    userId: doc.userId,
    originalMealId: doc.originalMealId,
    name: doc.name,
    mealType: doc.mealType,
    totalCalories: doc.totalCalories,
    totalProteinG: doc.totalProteinG,
    totalCarbsG: doc.totalCarbsG,
    totalFatG: doc.totalFatG,
    totalFiberG: doc.totalFiberG,
    items: doc.items.map(foodItemDocToEntry),
    useCount: doc.useCount,
    lastUsedAt: doc.lastUsedAt?.toDate() ?? null,
    createdAt: doc.createdAt.toDate(),
    updatedAt: doc.updatedAt.toDate(),
  };
}

export function favoriteEntryToDoc(entry: FavoriteMeal): FavoriteMealDoc {
  const now = Timestamp.fromDate(new Date());
  return {
    userId: entry.userId,
    originalMealId: entry.originalMealId,
    name: entry.name,
    mealType: entry.mealType,
    totalCalories: entry.totalCalories,
    totalProteinG: entry.totalProteinG,
    totalCarbsG: entry.totalCarbsG,
    totalFatG: entry.totalFatG,
    totalFiberG: entry.totalFiberG,
    items: entry.items.map(foodItemToDoc),
    useCount: entry.useCount ?? 0,
    lastUsedAt: entry.lastUsedAt ? Timestamp.fromDate(entry.lastUsedAt) : null,
    createdAt: now,
    updatedAt: now,
  };
}
