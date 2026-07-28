'use client';

import {
  calorieRingAccessibilityLabel,
  calorieRingAccessibilityValue,
} from '@/lib/design/calorie-ring-accessibility';
import { layout } from '@/lib/design/layout';
import { RING_SPRING_EASING, RING_SPRING_MS, useReducedMotion } from '@/lib/design/motion';
import { typography } from '@/lib/design/typography';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';
import { useCallback } from 'react';

export type RingMacro = 'protein' | 'carbs' | 'saturatedFat' | 'unsaturatedFat' | 'fiber';

export interface RingSegment {
  calories: number;
  macro: RingMacro;
}

const RING_SEGMENT_COLORS: Record<RingMacro, string> = {
  protein: 'stroke-cs-protein',
  carbs: 'stroke-cs-carbs',
  saturatedFat: 'stroke-cs-fat-saturated',
  unsaturatedFat: 'stroke-cs-fat-unsaturated',
  fiber: 'stroke-cs-success',
};

interface CalorieRingViewProps {
  segments: RingSegment[];
  target: number;
  consumed?: number;
  onClick?: () => void;
}

export function CalorieRingView({
  segments,
  target,
  consumed: consumedOverride,
  onClick,
}: CalorieRingViewProps) {
  const reducedMotion = useReducedMotion();
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );
  const consumed = consumedOverride ?? Math.round(segments.reduce((sum, s) => sum + s.calories, 0));
  const remaining = target - consumed;
  const { size, strokeWidth } = layout.calorieRing;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const baseline = Math.max(target, consumed);

  let cumulativeOffset = 0;
  const arcs = baseline > 0
    ? segments.map((seg) => {
        const arc = {
          macro: seg.macro,
          dashLength: (seg.calories / baseline) * circumference,
          offset: cumulativeOffset,
        };
        cumulativeOffset += arc.dashLength;
        return arc;
      })
    : [];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn('relative min-w-0', onClick && 'cursor-pointer')}
        style={{ width: size, height: size }}
        role={onClick ? 'button' : 'progressbar'}
        tabIndex={onClick ? 0 : undefined}
        aria-label={calorieRingAccessibilityLabel()}
        aria-valuenow={Math.abs(remaining)}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuetext={calorieRingAccessibilityValue(remaining, target)}
        onClick={onClick}
        onKeyDown={handleKeyDown}
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
          {arcs.map((seg) => {
            if (seg.dashLength <= 0) return null;

            return (
              <circle
                key={seg.macro}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={RING_SEGMENT_COLORS[seg.macro]}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                strokeDashoffset={-seg.offset}
                style={{
                  transition: reducedMotion
                    ? 'none'
                    : `stroke-dashoffset ${RING_SPRING_MS}ms ${RING_SPRING_EASING}`,
                }}
              />
            );
          })}

        </svg>
        <div className="absolute inset-0 flex min-w-0 flex-col items-center justify-center px-2">
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
      <p className={typography.csCaption}>
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
