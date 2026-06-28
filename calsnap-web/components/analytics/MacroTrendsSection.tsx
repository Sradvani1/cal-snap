'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { AnalyticsSectionCard } from '@/components/analytics/AnalyticsSectionCard';
import { AppConstants } from '@/lib/constants';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';
import type { MacroSplit } from '@/lib/models/macro-split';

interface MacroTrendsSectionProps {
  chartDailySeries: DailyNutritionSummary[];
  actualMacroSplit: MacroSplit;
  targetMacroSplit: MacroSplit;
}

interface ChartRow {
  dateLabel: string;
  proteinKcal: number;
  carbsKcal: number;
  fatKcal: number;
}

function formatAxisDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function macroSplitLabel(split: MacroSplit): string {
  return `${split.proteinPct}% P · ${split.carbsPct}% C · ${split.fatPct}% F`;
}

export function MacroTrendsSection({
  chartDailySeries,
  actualMacroSplit,
  targetMacroSplit,
}: MacroTrendsSectionProps) {
  const chartData: ChartRow[] = chartDailySeries.map((day) => ({
    dateLabel: formatAxisDate(day.date),
    proteinKcal: day.proteinG * AppConstants.Nutrition.proteinCalPerGram,
    carbsKcal: day.carbsG * AppConstants.Nutrition.carbsCalPerGram,
    fatKcal: day.fatG * AppConstants.Nutrition.fatCalPerGram,
  }));

  const ariaLabel = `Macro trends: actual ${macroSplitLabel(actualMacroSplit)}, target ${macroSplitLabel(targetMacroSplit)}`;

  return (
    <AnalyticsSectionCard title="Macro trends">
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-neutral-500">Actual</p>
          <p className="font-semibold text-neutral-900">{macroSplitLabel(actualMacroSplit)}</p>
        </div>
        <div>
          <p className="text-neutral-500">Target</p>
          <p className="font-semibold text-neutral-900">{macroSplitLabel(targetMacroSplit)}</p>
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
            <Bar dataKey="proteinKcal" stackId="macros" fill="#3b82f6" />
            <Bar dataKey="carbsKcal" stackId="macros" fill="#22c55e" />
            <Bar dataKey="fatKcal" stackId="macros" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsSectionCard>
  );
}
