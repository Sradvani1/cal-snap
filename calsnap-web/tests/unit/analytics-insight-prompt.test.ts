import { describe, expect, it } from 'vitest';
import { buildAnalyticsInsightPrompt } from '@/lib/gemini/analytics-insight-prompt';
import type { AnalyticsInsightPayload } from '@/lib/analytics/analytics-types';

function makePayload(
  overrides: Partial<AnalyticsInsightPayload> = {},
): AnalyticsInsightPayload {
  return {
    timeframeLabel: '7D',
    loggedDayCount: 5,
    averageDailyCalories: 1950,
    calorieTarget: 2000,
    adherencePercent: 60,
    actualMacroSplit: { proteinPct: 30, carbsPct: 45, fatPct: 25 },
    targetMacroSplit: { proteinPct: 28, carbsPct: 47, fatPct: 25 },
    averageDailyFiberG: 22,
    fiberTargetG: 28,
    weekendAverageCalories: 2100,
    weekdayAverageCalories: 1850,
    topFoods: [{ name: 'Chicken', count: 4, avgCalories: 200 }],
    weightChangeKg: -1.2,
    ...overrides,
  };
}

describe('buildAnalyticsInsightPrompt', () => {
  it('includes adherence and macro splits without image references', () => {
    const prompt = buildAnalyticsInsightPrompt(makePayload());
    expect(prompt).toContain('Days on target (±10%): 60%');
    expect(prompt).toContain('Macro split actual: 30% protein');
    expect(prompt).toContain('Macro split target: 28% protein');
    expect(prompt.toLowerCase()).not.toContain('photo');
    expect(prompt.toLowerCase()).not.toContain('image');
  });

  it('includes weekend and weekday averages when provided', () => {
    const prompt = buildAnalyticsInsightPrompt(makePayload());
    expect(prompt).toContain('Weekend avg calories: 2100; weekday avg: 1850');
  });

  it('includes weight change line when weightChangeKg is set', () => {
    const prompt = buildAnalyticsInsightPrompt(makePayload({ weightChangeKg: -1.2 }));
    expect(prompt).toContain('Weight change in period: lost 1.2 kg');
  });

  it('omits optional lines when data is missing', () => {
    const prompt = buildAnalyticsInsightPrompt(
      makePayload({
        weekendAverageCalories: null,
        weekdayAverageCalories: null,
        topFoods: [],
        weightChangeKg: null,
      }),
    );
    expect(prompt).not.toContain('Weekend avg calories');
    expect(prompt).not.toContain('Most logged foods');
    expect(prompt).not.toContain('Weight change in period');
  });
});
