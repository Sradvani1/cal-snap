'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/design/SectionCard';
import { AppConstants } from '@/lib/constants';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';
import type { MacroSplit } from '@/lib/models/macro-split';
import { copy } from '@/lib/copy';
import { lightColors } from '@/lib/design/colors';
import { typography } from '@/lib/design/typography';

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
  return copy('analytics.macro.split', {
    protein: split.proteinPct,
    carbs: split.carbsPct,
    fat: split.fatPct,
  });
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

  const ariaLabel = `${copy('analytics.section.macroTrends')}: ${copy('analytics.macro.actual')} ${macroSplitLabel(actualMacroSplit)}, ${copy('analytics.macro.target')} ${macroSplitLabel(targetMacroSplit)}`;

  return (
    <SectionCard title={copy('analytics.section.macroTrends')}>
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className={typography.csCaption}>{copy('analytics.macro.actual')}</p>
          <p className={typography.csCardTitle}>{macroSplitLabel(actualMacroSplit)}</p>
        </div>
        <div>
          <p className={typography.csCaption}>{copy('analytics.macro.target')}</p>
          <p className={typography.csCardTitle}>{macroSplitLabel(targetMacroSplit)}</p>
        </div>
      </div>

      <div role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-cs-border" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: lightColors.muted }}
              interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: lightColors.muted }} width={40} />
            <Bar dataKey="proteinKcal" stackId="macros" fill={lightColors.protein} />
            <Bar dataKey="carbsKcal" stackId="macros" fill={lightColors.carbs} />
            <Bar dataKey="fatKcal" stackId="macros" fill={lightColors.fat} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
