'use client';

import Link from 'next/link';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { SectionCard } from '@/components/design/SectionCard';
import { useReducedMotion } from '@/lib/design/motion';
import { typography } from '@/lib/design/typography';
import { copy } from '@/lib/copy';
import { displayWeight, formatWeight } from '@/lib/utilities/unit-formatters';
import type { WeighIn } from '@/lib/models/weigh-in';
import { cn } from '@/lib/utils/cn';

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
  const reducedMotion = useReducedMotion();
  const chartWidth = 280;
  const chartHeight = 120;
  const points = sparklinePoints(weighIns, useLbs, chartWidth, chartHeight);
  const hasChart = weighIns.length >= 2 && points.length > 0;
  const singleWeighIn = weighIns.length === 1 ? weighIns[0] : null;

  return (
    <SectionCard>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className={typography.csCardTitle}>{copy('dashboard.weight.title')}</h2>
        {onLogWeighIn && (
          <PrimaryButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onLogWeighIn();
            }}
            className="shrink-0 px-3 text-xs"
          >
            {copy('dashboard.weight.logWeighIn')}
          </PrimaryButton>
        )}
      </div>

      {hasChart ? (
        <Link href="/progress" className="block">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-[120px] w-full"
            role="img"
            aria-label={copy('dashboard.weight.trendA11y')}
          >
            <polyline
              fill="none"
              className={cn(
                'stroke-cs-foreground',
                !reducedMotion && 'animate-[chart-fade-in_700ms_ease-out]',
              )}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points}
            />
          </svg>
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-lg font-medium text-cs-foreground">
            {formatWeight(singleWeighIn?.weightKg ?? startingWeightKg, useLbs)}
          </p>
          {!singleWeighIn && (
            <p className={typography.csCaption}>{copy('dashboard.weight.startingWeight')}</p>
          )}
          {onLogWeighIn ? (
            <PrimaryButton type="button" onClick={onLogWeighIn}>
              {singleWeighIn
                ? copy('dashboard.weight.oneWeighIn')
                : copy('dashboard.weight.firstWeighIn')}
            </PrimaryButton>
          ) : (
            <p className="text-xs text-cs-muted">{copy('dashboard.weight.logInProgress')}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export function WeightTrendMiniChartSkeleton() {
  return (
    <SectionCard>
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-cs-muted/20" />
      <div className="h-[120px] animate-pulse rounded bg-cs-muted/20" />
    </SectionCard>
  );
}
