import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

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
      <div className={`flex items-center justify-between ${typography.csCaption}`}>
        <span>{copy('progress.bar.label')}</span>
        <span className="font-medium text-cs-foreground">{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-cs-muted/20"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={ariaValueText}
      >
        <div
          className="h-full rounded-full bg-cs-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function WeightProgressBarSkeleton() {
  return <div className="h-10 animate-pulse rounded-lg bg-cs-muted/20" />;
}
