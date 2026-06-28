import Link from 'next/link';
import { displayWeight, formatWeight } from '@/lib/utilities/unit-formatters';
import type { WeighIn } from '@/lib/models/weigh-in';

interface WeightTrendMiniChartProps {
  weighIns: WeighIn[];
  startingWeightKg: number;
  useLbs: boolean;
  onLogWeighIn?: () => void;
}

function sparklinePoints(
  weighIns: WeighIn[],
  useLbs: boolean,
  width: number,
  height: number,
): string {
  if (weighIns.length < 2) {
    return '';
  }

  const sorted = [...weighIns].sort((a, b) => a.date.getTime() - b.date.getTime());
  const values = sorted.map((entry) => displayWeight(entry.weightKg, useLbs));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return sorted
    .map((entry, index) => {
      const x = (index / (sorted.length - 1)) * width;
      const y = height - ((displayWeight(entry.weightKg, useLbs) - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

export function WeightTrendMiniChart({
  weighIns,
  startingWeightKg,
  useLbs,
  onLogWeighIn,
}: WeightTrendMiniChartProps) {
  const chartWidth = 280;
  const chartHeight = 120;
  const points = sparklinePoints(weighIns, useLbs, chartWidth, chartHeight);
  const hasChart = weighIns.length >= 2 && points.length > 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Weight Trend</h2>
        {onLogWeighIn && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onLogWeighIn();
            }}
            className="min-h-11 shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white"
          >
            Log weigh-in
          </button>
        )}
      </div>

      {hasChart ? (
        <Link href="/progress" className="block">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-[120px] w-full"
            role="img"
            aria-label="Seven-day weight trend"
          >
            <polyline
              fill="none"
              className="stroke-neutral-800"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points}
            />
          </svg>
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-lg font-medium text-neutral-900">
            {formatWeight(startingWeightKg, useLbs)}
          </p>
          <p className="text-sm text-neutral-500">Starting weight</p>
          {onLogWeighIn ? (
            <button
              type="button"
              onClick={onLogWeighIn}
              className="min-h-11 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Log your first weigh-in
            </button>
          ) : (
            <p className="text-xs text-neutral-400">Log weigh-in in Progress</p>
          )}
        </div>
      )}
    </div>
  );
}

export function WeightTrendMiniChartSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-neutral-100" />
      <div className="h-[120px] animate-pulse rounded bg-neutral-100" />
    </div>
  );
}
