'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/design/SectionCard';
import {
  calorieProgressBand,
  type CalorieProgressBand,
} from '@/lib/dashboard/calorie-progress';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';
import { copy } from '@/lib/copy';
import { calorieProgressColor } from '@/lib/design/colors';
import { useChartColors } from '@/lib/design/use-chart-colors';
import { useReducedMotion } from '@/lib/design/motion';
import { typography } from '@/lib/design/typography';

interface CalorieAdherenceSectionProps {
  chartDailySeries: DailyNutritionSummary[];
  calorieTarget: number;
  averageDailyCalories: number;
  adherencePct: number;
}

interface ChartRow {
  dateLabel: string;
  calories: number;
  band: CalorieProgressBand;
}

function formatAxisDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CalorieAdherenceSection({
  chartDailySeries,
  calorieTarget,
  averageDailyCalories,
  adherencePct,
}: CalorieAdherenceSectionProps) {
  const chartColors = useChartColors();
  const reducedMotion = useReducedMotion();

  const chartData: ChartRow[] = chartDailySeries.map((day) => {
    const ratio = calorieTarget > 0 ? day.calories / calorieTarget : 0;
    return {
      dateLabel: formatAxisDate(day.date),
      calories: day.calories,
      band: calorieProgressBand(ratio),
    };
  });

  const ariaLabel = copy('analytics.calorie.a11y', {
    avg: averageDailyCalories,
    target: calorieTarget,
    pct: adherencePct.toFixed(0),
  });

  return (
    <SectionCard title={copy('analytics.section.calorieAdherence')}>
      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className={typography.csCaption}>{copy('analytics.calorie.avgIntake')}</p>
          <p className={`${typography.csCardTitle} text-base`}>{averageDailyCalories}</p>
        </div>
        <div>
          <p className={typography.csCaption}>{copy('analytics.calorie.target')}</p>
          <p className={`${typography.csCardTitle} text-base`}>{calorieTarget}</p>
        </div>
        <div>
          <p className={typography.csCaption}>{copy('analytics.calorie.onTarget')}</p>
          <p className={`${typography.csCardTitle} text-base`}>{adherencePct.toFixed(0)}%</p>
        </div>
      </div>

      <div role="img" aria-label={ariaLabel} className="min-w-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-cs-border" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: chartColors.muted }}
              interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: chartColors.muted }} width={40} />
            <ReferenceLine
              y={calorieTarget}
              stroke={chartColors.muted}
              strokeDasharray="4 4"
              label={{
                value: copy('analytics.calorie.target'),
                position: 'insideTopRight',
                fontSize: 11,
                fill: chartColors.muted,
              }}
            />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]} isAnimationActive={!reducedMotion}>
              {chartData.map((row) => (
                <Cell key={row.dateLabel} fill={calorieProgressColor(row.band)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
