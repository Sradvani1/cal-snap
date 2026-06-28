import type { MealType } from '@/lib/models/meal-type';
import type { FoodItem } from '@/lib/models/food-item';

/** Logged meal entry. Totals and item weights are in metric units. */
export interface MealEntry {
  id: string;
  userId: string;
  timestamp: Date;
  mealType: MealType;
  /** Firebase Storage path; populated when a photo is uploaded (W04). */
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
  items: FoodItem[];
}
