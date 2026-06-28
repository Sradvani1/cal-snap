import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface NutrientStatRowProps {
  label: string;
  value: string;
  target?: string;
  layout?: 'row' | 'card';
  className?: string;
}

export function NutrientStatRow({
  label,
  value,
  target,
  layout = 'row',
  className,
}: NutrientStatRowProps) {
  const ariaLabel = target
    ? copy('designSystem.nutrientStat.accessibility.withTarget', { label, value, target })
    : copy('designSystem.nutrientStat.accessibility.basic', { label, value });

  if (layout === 'card') {
    return (
      <div
        className={cn('rounded-lg bg-cs-muted/10 px-3 py-2 text-center', className)}
        aria-label={ariaLabel}
      >
        <p className={typography.csCaption}>{label}</p>
        <p className={cn(typography.csBody, 'font-semibold tabular-nums')}>{value}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between gap-2', className)} aria-label={ariaLabel}>
      <span className={typography.csCaption}>{label}</span>
      <div className="text-right">
        <span className={cn(typography.csBody, 'font-semibold tabular-nums')}>{value}</span>
        {target ? (
          <p className="text-xs text-cs-muted">
            {copy('designSystem.nutrientStat.target', { target })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
