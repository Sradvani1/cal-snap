import type { AnalyticsInsightPayload } from '@/lib/analytics/analytics-types';

export const ANALYTICS_INSIGHT_SYSTEM_INSTRUCTION =
  'You are a nutrition coach. Based only on the aggregated dietary statistics below, write a 2–3 sentence actionable insight. Do not invent data beyond what is provided. Be encouraging and specific.';

export function buildAnalyticsInsightPrompt(payload: AnalyticsInsightPayload): string {
  const lines: string[] = [
    `Timeframe: ${payload.timeframeLabel}`,
    `Logged days: ${payload.loggedDayCount}`,
    `Average daily calories: ${payload.averageDailyCalories} (target: ${payload.calorieTarget})`,
    `Days on target (±10%): ${payload.adherencePercent.toFixed(0)}%`,
    `Macro split actual: ${payload.actualMacroSplit.proteinPct}% protein, ${payload.actualMacroSplit.carbsPct}% carbs, ${payload.actualMacroSplit.fatPct}% fat`,
    `Macro split target: ${payload.targetMacroSplit.proteinPct}% protein, ${payload.targetMacroSplit.carbsPct}% carbs, ${payload.targetMacroSplit.fatPct}% fat`,
    `Average daily fiber: ${payload.averageDailyFiberG.toFixed(0)}g (target: ${payload.fiberTargetG.toFixed(0)}g)`,
  ];

  if (
    payload.weekendAverageCalories !== null &&
    payload.weekdayAverageCalories !== null
  ) {
    lines.push(
      `Weekend avg calories: ${payload.weekendAverageCalories}; weekday avg: ${payload.weekdayAverageCalories}`,
    );
  }

  if (payload.topFoods.length > 0) {
    const foodSummary = payload.topFoods
      .map((food) => `${food.name} (${food.count}×)`)
      .join(', ');
    lines.push(`Most logged foods: ${foodSummary}`);
  }

  if (payload.weightChangeKg !== null) {
    const direction = payload.weightChangeKg < 0 ? 'lost' : 'gained';
    lines.push(
      `Weight change in period: ${direction} ${Math.abs(payload.weightChangeKg).toFixed(1)} kg`,
    );
  }

  return lines.join('\n');
}
