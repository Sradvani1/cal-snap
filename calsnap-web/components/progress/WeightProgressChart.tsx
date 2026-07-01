'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import type { WeighIn } from '@/lib/models/weigh-in';
import { copy } from '@/lib/copy';
import { useChartColors } from '@/lib/design/use-chart-colors';
import { useReducedMotion } from '@/lib/design/motion';
import { typography } from '@/lib/design/typography';
import { compareWeighInsChronological } from '@/lib/progress/progress-stats';
import { displayWeight } from '@/lib/utilities/unit-formatters';
import { cn } from '@/lib/utils/cn';

interface WeightProgressChartProps {
  weighIns: WeighIn[];
  projectionPoints: Array<{ date: Date; weightKg: number }>;
  goalWeightKg: number;
  useLbs: boolean;
  ariaLabel: string;
  onLogWeighIn?: () => void;
}

interface ChartPoint {
  id: string;
  dateMs: number;
  dateLabel: string;
  actual?: number;
  projected?: number;
}

function formatAxisDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function WeightProgressChart({
  weighIns,
  projectionPoints,
  goalWeightKg,
  useLbs,
  ariaLabel,
  onLogWeighIn,
}: WeightProgressChartProps) {
  const chartColors = useChartColors();
  const reducedMotion = useReducedMotion();

  if (weighIns.length === 0) {
    if (onLogWeighIn) {
      return (
        <EmptyStateView
          icon="📈"
          titleKey="progress.chart.empty"
          messageKey="progress.history.empty"
          actionTitleKey="progress.chart.firstWeighIn"
          onAction={onLogWeighIn}
        />
      );
    }

    return (
      <div
        className={cn(
          typography.csCaption,
          'rounded-2xl border border-cs-border bg-cs-surface p-8 text-center shadow-sm dark:shadow-none',
        )}
      >
        {copy('progress.chart.empty')}
      </div>
    );
  }

  const actualSorted = [...weighIns].sort(compareWeighInsChronological);
  const chartData: ChartPoint[] = actualSorted.map((entry) => ({
    id: entry.id,
    dateMs: entry.date.getTime(),
    dateLabel: formatAxisDate(entry.date),
    actual: displayWeight(entry.weightKg, useLbs),
  }));

  for (const point of projectionPoints) {
    const dateMs = point.date.getTime();
    const existing = chartData.find((row) => row.dateMs === dateMs && row.projected === undefined);
    if (existing) {
      existing.projected = displayWeight(point.weightKg, useLbs);
    } else {
      chartData.push({
        id: `projection-${dateMs}`,
        dateMs,
        dateLabel: formatAxisDate(point.date),
        projected: displayWeight(point.weightKg, useLbs),
      });
    }
  }

  chartData.sort((a, b) => a.dateMs - b.dateMs || a.id.localeCompare(b.id));
  const goalDisplay = displayWeight(goalWeightKg, useLbs);
  const showProjection = weighIns.length >= 2 && projectionPoints.length > 0;

  return (
    <div
      className="rounded-2xl border border-cs-border bg-cs-surface p-4 shadow-sm dark:shadow-none"
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-cs-border" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: chartColors.muted }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: chartColors.muted }}
            domain={['auto', 'auto']}
            width={40}
          />
          <ReferenceLine
            y={goalDisplay}
            stroke={chartColors.muted}
            strokeDasharray="4 4"
            label={{
              value: copy('progress.chart.goalLabel'),
              position: 'insideTopRight',
              fontSize: 11,
              fill: chartColors.muted,
            }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={chartColors.foreground}
            strokeWidth={2}
            dot={{ r: 4, fill: chartColors.foreground }}
            connectNulls={false}
            isAnimationActive={!reducedMotion}
          />
          {showProjection && (
            <Line
              type="monotone"
              dataKey="projected"
              stroke={chartColors.muted}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
              isAnimationActive={!reducedMotion}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightProgressChartSkeleton() {
  return (
    <div className="h-[272px] animate-pulse rounded-2xl border border-cs-border bg-cs-muted/20" />
  );
}
