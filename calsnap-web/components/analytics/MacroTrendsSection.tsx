'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/design/SectionCard';
import { AppConstants } from '@/lib/constants';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';
import { copy } from '@/lib/copy';
import { useChartColors } from '@/lib/design/use-chart-colors';
import { useReducedMotion } from '@/lib/design/motion';

interface MacroTrendsSectionProps {
  chartDailySeries: DailyNutritionSummary[];
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

const tooltipContainerStyle = {
  backgroundColor: 'var(--cs-surface)',
  border: '1px solid var(--cs-border)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  color: 'var(--cs-foreground)',
};

const tooltipLabelStyle = { fontWeight: 600, color: 'var(--cs-foreground)' };
const tooltipItemStyle = { color: 'var(--cs-muted)' };

export function MacroTrendsSection({
  chartDailySeries,
}: MacroTrendsSectionProps) {
  const chartColors = useChartColors();
  const reducedMotion = useReducedMotion();

  const chartData: ChartRow[] = chartDailySeries.map((day) => ({
    dateLabel: formatAxisDate(day.date),
    proteinKcal: day.proteinG * AppConstants.Nutrition.proteinCalPerGram,
    carbsKcal: day.carbsG * AppConstants.Nutrition.carbsCalPerGram,
    fatKcal: day.fatG * AppConstants.Nutrition.fatCalPerGram,
  }));

  const ariaLabel = copy('analytics.section.macroTrends');

  return (
    <SectionCard title={copy('analytics.section.macroTrends')}>
      <div className="mb-3 flex gap-4 text-xs text-cs-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: chartColors.protein }} />
          {copy('analytics.macro.legendProtein')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: chartColors.carbs }} />
          {copy('analytics.macro.legendCarbs')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: chartColors.fat }} />
          {copy('analytics.macro.legendFat')}
        </span>
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
            <Tooltip
              cursor={false}
              contentStyle={tooltipContainerStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              formatter={(value: number, name: string, _entry: unknown, _idx: unknown, payload: Array<{ value?: number }>) => {
                const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                const labels: Record<string, string> = {
                  proteinKcal: copy('analytics.macro.legendProtein'),
                  carbsKcal: copy('analytics.macro.legendCarbs'),
                  fatKcal: copy('analytics.macro.legendFat'),
                };
                return [`${pct}%`, labels[name] ?? name];
              }}
            />
            <Bar
              dataKey="proteinKcal"
              stackId="macros"
              fill={chartColors.protein}
              isAnimationActive={!reducedMotion}
            />
            <Bar
              dataKey="carbsKcal"
              stackId="macros"
              fill={chartColors.carbs}
              isAnimationActive={!reducedMotion}
            />
            <Bar
              dataKey="fatKcal"
              stackId="macros"
              fill={chartColors.fat}
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
