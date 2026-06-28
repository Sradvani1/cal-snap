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
import { AnalyticsSectionCard } from '@/components/analytics/AnalyticsSectionCard';
import {
  calorieProgressBand,
  type CalorieProgressBand,
} from '@/lib/dashboard/calorie-progress';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';

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

function bandBarColor(band: CalorieProgressBand): string {
  switch (band) {
    case 'under':
      return '#10b981';
    case 'onTrack':
      return '#f59e0b';
    case 'over':
      return '#ef4444';
  }
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
  const chartData: ChartRow[] = chartDailySeries.map((day) => {
    const ratio = calorieTarget > 0 ? day.calories / calorieTarget : 0;
    return {
      dateLabel: formatAxisDate(day.date),
      calories: day.calories,
      band: calorieProgressBand(ratio),
    };
  });

  const ariaLabel = `Calorie adherence: average ${averageDailyCalories} kcal per day, target ${calorieTarget}, ${adherencePct.toFixed(0)}% of logged days on target`;

  return (
    <AnalyticsSectionCard title="Calorie adherence">
      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-neutral-500">Avg intake</p>
          <p className="font-semibold text-neutral-900">{averageDailyCalories}</p>
        </div>
        <div>
          <p className="text-neutral-500">Target</p>
          <p className="font-semibold text-neutral-900">{calorieTarget}</p>
        </div>
        <div>
          <p className="text-neutral-500">On target</p>
          <p className="font-semibold text-neutral-900">{adherencePct.toFixed(0)}%</p>
        </div>
      </div>

      <div role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-100" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: '#737373' }}
              interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#737373' }} width={40} />
            <ReferenceLine
              y={calorieTarget}
              stroke="#737373"
              strokeDasharray="4 4"
              label={{ value: 'Target', position: 'insideTopRight', fontSize: 11, fill: '#737373' }}
            />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
              {chartData.map((row) => (
                <Cell key={row.dateLabel} fill={bandBarColor(row.band)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsSectionCard>
  );
}
