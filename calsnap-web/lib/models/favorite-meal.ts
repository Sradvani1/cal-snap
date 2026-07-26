import type { FoodItem } from './food-item';
import type { MealType } from './meal-type';

export interface FavoriteMeal {
  id: string;
  userId: string;
  originalMealId: string;
  name: string;
  mealType: MealType;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  items: FoodItem[];
  useCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
