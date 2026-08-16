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
import { displayWeight, formatDateShort } from '@/lib/utilities/unit-formatters';
import { cn } from '@/lib/utils/cn';

interface WeightProgressChartProps {
  weighIns: WeighIn[];
  projectionPoints: Array<{ date: Date; weightKg: number }>;
  startingWeightKg: number;
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

/** Renders axis weight labels cleanly: 70, 70.5, 176.4 (no trailing ".0"). */
function formatAxisWeight(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

function formatProjectionLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function WeightProgressChart({
  weighIns,
  projectionPoints,
  startingWeightKg,
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
    dateLabel: formatDateShort(entry.date),
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
        dateLabel: formatProjectionLabel(point.date),
        projected: displayWeight(point.weightKg, useLbs),
      });
    }
  }

  chartData.sort((a, b) => a.dateMs - b.dateMs || a.id.localeCompare(b.id));
  const startDisplay = displayWeight(startingWeightKg, useLbs);
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
            allowDuplicatedCategory
          />
          <YAxis
            tick={{ fontSize: 11, fill: chartColors.muted }}
            domain={['auto', 'auto']}
            width={40}
            tickFormatter={formatAxisWeight}
          />
          <ReferenceLine
            y={startDisplay}
            stroke={chartColors.muted}
            strokeDasharray="8 4"
            ifOverflow="extendDomain"
          />
          <ReferenceLine
            y={goalDisplay}
            stroke={chartColors.muted}
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
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
