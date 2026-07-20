import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface MacroBarViewProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  className?: string;
}

export function MacroBarView({ proteinG, carbsG, fatG, fiberG, className }: MacroBarViewProps) {
  const total = proteinG + carbsG + fatG + fiberG;
  const { height, radius } = layout.macroBar;

  const accessibilitySummary =
    total > 0
      ? copy('designSystem.macroBar.accessibility.summary', {
          protein: Math.round(proteinG),
          carbs: Math.round(carbsG),
          fat: Math.round(fatG),
          fiber: Math.round(fiberG),
        })
      : copy('designSystem.macroBar.noData');

  if (total <= 0) {
    return (
      <div className={className} aria-label={accessibilitySummary}>
        <div
          className="w-full bg-cs-muted/25"
          style={{ height, borderRadius: radius }}
        />
        <p className={cn(typography.csCaption, 'mt-2')}>
          {copy('designSystem.macroBar.noData')}
        </p>
      </div>
    );
  }

  const proteinWidth = (proteinG / total) * 100;
  const carbsWidth = (carbsG / total) * 100;
  const fatWidth = (fatG / total) * 100;
  const fiberWidth = (fiberG / total) * 100;

  return (
    <div className={className} aria-label={accessibilitySummary}>
      <div
        className="flex w-full overflow-hidden"
        style={{ height, borderRadius: radius }}
        aria-hidden
      >
        {proteinWidth > 0 && (
          <div className="bg-cs-protein" style={{ width: `${proteinWidth}%` }} />
        )}
        {carbsWidth > 0 && <div className="bg-cs-carbs" style={{ width: `${carbsWidth}%` }} />}
        {fatWidth > 0 && <div className="bg-cs-fat" style={{ width: `${fatWidth}%` }} />}
        {fiberWidth > 0 && <div className="bg-cs-success" style={{ width: `${fiberWidth}%` }} />}
      </div>
    </div>
  );
}
