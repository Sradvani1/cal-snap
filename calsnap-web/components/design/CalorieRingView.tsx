'use client';

import type { CalorieProgressBand } from '@/lib/dashboard/calorie-progress';
import {
  calorieBandIcon,
  calorieBandLabel,
  calorieRingAccessibilityLabel,
  calorieRingAccessibilityValue,
} from '@/lib/design/calorie-ring-accessibility';
import { calorieProgressStrokeClass } from '@/lib/design/colors';
import { layout } from '@/lib/design/layout';
import { RING_SPRING_EASING, RING_SPRING_MS, useReducedMotion } from '@/lib/design/motion';
import { typography } from '@/lib/design/typography';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';

function bandTextClass(band: CalorieProgressBand): string {
  switch (band) {
    case 'under':
      return 'text-cs-success';
    case 'onTrack':
      return 'text-cs-warning';
    case 'over':
      return 'text-cs-danger';
  }
}

interface CalorieRingViewProps {
  consumed: number;
  target: number;
  remaining: number;
  progress: number;
  band: CalorieProgressBand;
  /** Force band label visible (high contrast mode also shows it) */
  showBandLabel?: boolean;
}

export function CalorieRingView({
  consumed,
  target,
  remaining,
  progress,
  band,
  showBandLabel = false,
}: CalorieRingViewProps) {
  const reducedMotion = useReducedMotion();
  const ringProgress = Math.min(Math.max(progress, 0), 1);
  const isOverTarget = progress > 1;
  const { size, strokeWidth, overStrokeWidth } = layout.calorieRing;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ringProgress);
  const strokeClass = calorieProgressStrokeClass(band);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative min-w-0"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-label={calorieRingAccessibilityLabel()}
        aria-valuenow={Math.abs(remaining)}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuetext={calorieRingAccessibilityValue(remaining, target)}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-cs-border"
            strokeWidth={strokeWidth}
          />
          {isOverTarget && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={cn(strokeClass, 'opacity-35')}
              strokeWidth={overStrokeWidth}
            />
          )}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={strokeClass}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: reducedMotion
                ? 'none'
                : `stroke-dashoffset ${RING_SPRING_MS}ms ${RING_SPRING_EASING}`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex min-w-0 flex-col items-center justify-center px-2">
          <span
            className={cn(
              'contrast-more:flex forced-colors:flex hidden items-center gap-1 text-xs font-semibold',
              showBandLabel && 'flex',
              bandTextClass(band),
            )}
          >
            <span aria-hidden>{calorieBandIcon(band)}</span>
            {calorieBandLabel(band)}
          </span>
          <span className={cn(typography.csLargeCalorie, 'min-w-0 max-w-full truncate')}>
            {Math.abs(remaining)}
          </span>
          <span className={typography.csCaption}>
            {remaining >= 0
              ? copy('designSystem.calorieRing.remaining')
              : copy('designSystem.calorieRing.over')}
          </span>
        </div>
      </div>
      <p className={typography.csCaption}>
        {copy('designSystem.calorieRing.ofGoal', { target })}
      </p>
      <p className="text-xs text-cs-muted">
        {copy('designSystem.calorieRing.consumed', { consumed })}
      </p>
    </div>
  );
}

export function CalorieRingViewSkeleton() {
  const { size } = layout.calorieRing;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="animate-pulse rounded-full bg-cs-muted/20"
        style={{ width: size, height: size }}
      />
      <div className="h-4 w-32 animate-pulse rounded bg-cs-muted/20" />
    </div>
  );
}
