import type { CalorieProgressBand } from '@/lib/dashboard/calorie-progress';

interface CalorieRingCardProps {
  consumed: number;
  target: number;
  remaining: number;
  progress: number;
  band: CalorieProgressBand;
}

function bandStrokeClass(band: CalorieProgressBand): string {
  switch (band) {
    case 'under':
      return 'stroke-emerald-500';
    case 'onTrack':
      return 'stroke-amber-500';
    case 'over':
      return 'stroke-red-500';
  }
}

export function CalorieRingCard({
  consumed,
  target,
  remaining,
  progress,
  band,
}: CalorieRingCardProps) {
  const ringProgress = Math.min(Math.max(progress, 0), 1);
  const isOverTarget = progress > 1;
  const size = 180;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ringProgress);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className="stroke-neutral-200"
              strokeWidth={strokeWidth}
            />
            {isOverTarget && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={`${bandStrokeClass(band)} opacity-35`}
                strokeWidth={strokeWidth + 4}
              />
            )}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={`${bandStrokeClass(band)} transition-all duration-500 ease-out`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold tabular-nums text-neutral-900">
              {Math.abs(remaining)}
            </span>
            <span className="text-sm text-neutral-500">
              {remaining >= 0 ? 'remaining' : 'over'}
            </span>
          </div>
        </div>
        <p className="text-sm text-neutral-500">of {target} kcal goal</p>
        <p className="text-xs text-neutral-400">{consumed} kcal consumed</p>
      </div>
    </div>
  );
}

export function CalorieRingCardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-[180px] w-[180px] animate-pulse rounded-full bg-neutral-100" />
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
