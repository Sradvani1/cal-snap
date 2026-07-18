'use client';

import Link from 'next/link';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { SectionCard } from '@/components/design/SectionCard';
import { useReducedMotion } from '@/lib/design/motion';
import { typography } from '@/lib/design/typography';
import { copy } from '@/lib/copy';
import { displayWeight, formatWeight, formatDateShort } from '@/lib/utilities/unit-formatters';
import type { WeighIn } from '@/lib/models/weigh-in';
import { cn } from '@/lib/utils/cn';

interface WeightTrendMiniChartProps {
  weighIns: WeighIn[];
  startingWeightKg: number;
  goalWeightKg: number;
  useLbs: boolean;
  onLogWeighIn?: () => void;
}

const CHART_WIDTH = 280;
const CHART_HEIGHT = 120;
const PADDING_Y = 12;

function earliestDate(weighIns: WeighIn[]): Date {
  return weighIns.reduce(
    (earliest, entry) => (entry.date.getTime() < earliest.getTime() ? entry.date : earliest),
    weighIns[0].date,
  );
}

function latestDate(weighIns: WeighIn[]): Date {
  return weighIns.reduce(
    (latest, entry) => (entry.date.getTime() > latest.getTime() ? entry.date : latest),
    weighIns[0].date,
  );
}

function weightToY(weightKg: number, min: number, max: number, useLbs: boolean): number {
  const value = displayWeight(weightKg, useLbs);
  const range = max - min || 1;
  return CHART_HEIGHT - PADDING_Y - ((value - min) / range) * (CHART_HEIGHT - PADDING_Y * 2);
}

function sparklinePoints(
  weighIns: WeighIn[],
  min: number,
  max: number,
  useLbs: boolean,
): string {
  const sorted = [...weighIns].sort((a, b) => a.date.getTime() - b.date.getTime());
  const start = earliestDate(sorted).getTime();
  const end = latestDate(sorted).getTime();
  const span = end - start || 1;

  return sorted
    .map((entry) => {
      const x = ((entry.date.getTime() - start) / span) * CHART_WIDTH;
      const y = weightToY(entry.weightKg, min, max, useLbs);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function WeightTrendMiniChart({
  weighIns,
  startingWeightKg,
  goalWeightKg,
  useLbs,
  onLogWeighIn,
}: WeightTrendMiniChartProps) {
  const reducedMotion = useReducedMotion();
  const sorted = [...weighIns].sort((a, b) => a.date.getTime() - b.date.getTime());
  const values = sorted.map((entry) => displayWeight(entry.weightKg, useLbs));

  const referenceWeights = [
    ...values,
    startingWeightKg > 0 ? displayWeight(startingWeightKg, useLbs) : null,
    goalWeightKg > 0 ? displayWeight(goalWeightKg, useLbs) : null,
  ].filter((v): v is number => typeof v === 'number');

  const min = Math.min(...referenceWeights);
  const max = Math.max(...referenceWeights);
  const points = sparklinePoints(sorted, min, max, useLbs);

  const hasChart = sorted.length >= 2 && points.length > 0;
  const singleWeighIn = sorted.length === 1 ? sorted[0] : null;

  const goalY =
    goalWeightKg > 0 ? weightToY(goalWeightKg, min, max, useLbs) : null;

  const rangeStartLabel = hasChart ? formatDateShort(earliestDate(sorted)) : '';
  const rangeEndLabel = hasChart ? formatDateShort(latestDate(sorted)) : '';

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
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-[120px] w-full"
            role="img"
            aria-label={copy('dashboard.weight.trendA11y', {
              start: rangeStartLabel,
              end: rangeEndLabel,
            })}
          >
            {goalY !== null && (
              <line
                x1={0}
                y1={goalY}
                x2={CHART_WIDTH}
                y2={goalY}
                className="stroke-cs-muted"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )}
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
          <div className="mt-2 flex items-center justify-between text-xs text-cs-muted">
            <span>{rangeStartLabel}</span>
            {goalWeightKg > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-px w-3 border-t border-dashed border-cs-muted" />
                {copy('dashboard.weight.goalLine')} {formatWeight(goalWeightKg, useLbs)}
              </span>
            )}
            <span>{rangeEndLabel}</span>
          </div>
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
