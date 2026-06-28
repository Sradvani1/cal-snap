/** Weigh-in record. Weight stored in kilograms. */
export interface WeighIn {
  id: string;
  userId: string;
  date: Date;
  weightKg: number;
  calculatedTDEE?: number;
  adjustedDailyTarget?: number;
  bmi?: number;
  source?: 'manual';
  createdAt?: Date;
}
