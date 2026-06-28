import type { ConfidenceLevel } from '@/lib/scanner/meal-totals';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  score?: number;
}

const LABELS: Record<ConfidenceLevel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  manual: 'Manual entry',
};

const STYLES: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
  manual: 'bg-neutral-100 text-neutral-700',
};

export function ConfidenceBadge({ level, score }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[level]}`}
    >
      {LABELS[level]}
      {level !== 'manual' && score !== undefined && (
        <span className="ml-1 tabular-nums">({Math.round(score * 100)}%)</span>
      )}
    </span>
  );
}
