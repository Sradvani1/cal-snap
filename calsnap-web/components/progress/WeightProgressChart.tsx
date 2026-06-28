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
import type { WeighIn } from '@/lib/models/weigh-in';
import { compareWeighInsChronological } from '@/lib/progress/progress-stats';
import { displayWeight } from '@/lib/utilities/unit-formatters';

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
  if (weighIns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-neutral-600">Track your weight over time</p>
        {onLogWeighIn && (
          <button
            type="button"
            onClick={onLogWeighIn}
            className="min-h-11 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
          >
            Log your first weigh-in
          </button>
        )}
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
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-100" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: '#737373' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#737373' }}
            domain={['auto', 'auto']}
            width={40}
          />
          <ReferenceLine
            y={goalDisplay}
            stroke="#a3a3a3"
            strokeDasharray="4 4"
            label={{ value: 'Goal', position: 'insideTopRight', fontSize: 11, fill: '#737373' }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#171717"
            strokeWidth={2}
            dot={{ r: 4, fill: '#171717' }}
            connectNulls={false}
          />
          {showProjection && (
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#737373"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightProgressChartSkeleton() {
  return (
    <div className="h-[272px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
  );
}
