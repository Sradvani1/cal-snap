import { z } from 'zod';
import type { AnalyticsInsightPayload } from '@/lib/analytics/analytics-types';

const macroSplitSchema = z.object({
  proteinPct: z.number(),
  carbsPct: z.number(),
  fatPct: z.number(),
});

const topFoodSchema = z.object({
  name: z.string().max(80),
  count: z.number().int().positive(),
  avgCalories: z.number().int(),
});

export const analyticsInsightPayloadSchema = z.object({
  timeframeLabel: z.string().max(32),
  loggedDayCount: z.number().int().min(0),
  averageDailyCalories: z.number().int(),
  calorieTarget: z.number().int(),
  adherencePercent: z.number(),
  actualMacroSplit: macroSplitSchema,
  targetMacroSplit: macroSplitSchema,
  averageDailyFiberG: z.number(),
  fiberTargetG: z.number(),
  weekendAverageCalories: z.number().int().nullable(),
  weekdayAverageCalories: z.number().int().nullable(),
  topFoods: z.array(topFoodSchema).max(5),
  weightChangeKg: z.number().nullable(),
});

export type ParsedAnalyticsInsightPayload = z.infer<typeof analyticsInsightPayloadSchema>;

export function parseAnalyticsInsightPayload(
  raw: unknown,
): { success: true; data: AnalyticsInsightPayload } | { success: false; error: string } {
  const parsed = analyticsInsightPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }
  return { success: true, data: parsed.data };
}
