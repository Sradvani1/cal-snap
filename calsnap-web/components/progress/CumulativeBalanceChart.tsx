'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/design/SectionCard';
import type { DailyCalorieSummary } from '@/lib/queries/use-daily-calorie-summaries';
import { copy } from '@/lib/copy';
import { useChartColors } from '@/lib/design/use-chart-colors';
import { useReducedMotion } from '@/lib/design/motion';

interface CumulativeBalanceChartProps {
  dailySummaries: DailyCalorieSummary[];
  dailyTarget: number;
}

interface ChartPoint {
  dateLabel: string;
  balance: number;
}

function formatAxisDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const tooltipStyle = {
  backgroundColor: 'var(--cs-surface)',
  border: '1px solid var(--cs-border)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const tooltipLabelStyle = { fontWeight: 600, color: 'var(--cs-foreground)' };
const tooltipItemStyle = { color: 'var(--cs-muted)' };

export function CumulativeBalanceChart({
  dailySummaries,
  dailyTarget,
}: CumulativeBalanceChartProps) {
  const chartColors = useChartColors();
  const reducedMotion = useReducedMotion();

  const chartData: ChartPoint[] = useMemo(() => {
    if (dailySummaries.length === 0) return [];

    let cumulative = 0;
    return dailySummaries.map((day) => {
      const balance = dailyTarget - day.totalCalories;
      cumulative += balance;
      return {
        dateLabel: formatAxisDate(day.date),
        balance: cumulative,
      };
    });
  }, [dailySummaries, dailyTarget]);

  if (chartData.length < 2) return null;

  const balanceColor = chartData[chartData.length - 1].balance >= 0
    ? chartColors.success
    : chartColors.danger;

  return (
    <SectionCard title={copy('progress.balance.title')}>
      <div className="min-w-0">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-cs-border" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: chartColors.muted }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11, fill: chartColors.muted }} width={40} />
            <Tooltip
              cursor={false}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              formatter={(value: number) => [`${value >= 0 ? '+' : ''}${Math.round(value)} kcal`]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={balanceColor}
              fill={balanceColor}
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={!reducedMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function CumulativeBalanceChartSkeleton() {
  return (
    <div className="h-[232px] animate-pulse rounded-2xl border border-cs-border bg-cs-muted/20" />
  );
}
