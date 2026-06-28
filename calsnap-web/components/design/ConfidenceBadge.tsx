import type { ConfidenceLevel } from '@/lib/scanner/meal-totals';
import { confidenceBadgeStyles } from '@/lib/design/colors';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  score?: number;
}

function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return copy('scanner.confidence.high');
    case 'medium':
      return copy('scanner.confidence.medium');
    case 'low':
      return copy('scanner.confidence.low');
    case 'manual':
      return copy('designSystem.confidence.manualEntry');
  }
}

export function ConfidenceBadge({ level, score }: ConfidenceBadgeProps) {
  const label = confidenceLabel(level);
  const percent = score !== undefined ? Math.round(score * 100) : undefined;
  const styles = confidenceBadgeStyles(level);

  const displayText =
    level !== 'manual' && percent !== undefined
      ? copy('designSystem.confidence.levelWithPercent', { level: label, percent })
      : label;

  const ariaLabel =
    level !== 'manual' && percent !== undefined
      ? copy('designSystem.confidence.accessibility', { level: label, percent })
      : label;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium contrast-more:border',
        styles.container,
        'contrast-more:border-current forced-colors:border',
      )}
      aria-label={ariaLabel}
    >
      {displayText}
    </span>
  );
}
