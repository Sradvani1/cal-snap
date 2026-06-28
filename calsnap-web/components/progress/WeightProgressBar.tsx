interface WeightProgressBarProps {
  progressFraction: number;
  ariaValueText: string;
}

export function WeightProgressBar({
  progressFraction,
  ariaValueText,
}: WeightProgressBarProps) {
  const percent = Math.round(progressFraction * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-neutral-600">
        <span>Progress to goal</span>
        <span className="font-medium text-neutral-900">{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-neutral-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={ariaValueText}
      >
        <div
          className="h-full rounded-full bg-neutral-800 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function WeightProgressBarSkeleton() {
  return <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />;
}
