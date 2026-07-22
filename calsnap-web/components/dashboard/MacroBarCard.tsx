import { typography } from '@/lib/design/typography';
import { MacroBarView } from '@/components/design/MacroBarView';
import { SectionCard, SectionCardSkeleton } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';

interface MacroBarCardProps {
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatConsumed: number;
  fatTarget: number;
  saturatedFatConsumed: number;
  unsaturatedFatConsumed: number;
  fiberConsumed: number;
  fiberTarget: number;
}

function barWidth(consumed: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Math.min((consumed / target) * 100, 100);
}

function MacroRow({
  label,
  consumed,
  target,
  barClassName,
  subConsumedA,
  subConsumedB,
  subBarClassNameA,
  subBarClassNameB,
  subLabelA,
  subLabelB,
}: {
  label: string;
  consumed: number;
  target: number;
  barClassName: string;
  subConsumedA?: number;
  subConsumedB?: number;
  subBarClassNameA?: string;
  subBarClassNameB?: string;
  subLabelA?: string;
  subLabelB?: string;
}) {
  const hasSplit = subConsumedA !== undefined && subConsumedB !== undefined;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={typography.csMacroLabel}>{label}</span>
        <span className="tabular-nums text-cs-muted">
          {hasSplit
            ? `${Math.round(subConsumedB)}g / ${Math.round(subConsumedA)}g / ${Math.round(target)}g`
            : `${Math.round(consumed)}g / ${Math.round(target)}g`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-cs-muted/20 flex">
        {hasSplit ? (
          <>
            <div
              className={`h-full transition-all duration-300 ${subBarClassNameA}`}
              style={{ width: `${barWidth(subConsumedA, target)}%` }}
              title={subLabelA ? `${subLabelA}: ${Math.round(subConsumedA)}g` : undefined}
            />
            <div
              className={`h-full transition-all duration-300 ${subBarClassNameB}`}
              style={{ width: `${barWidth(subConsumedB, target)}%` }}
              title={subLabelB ? `${subLabelB}: ${Math.round(subConsumedB)}g` : undefined}
            />
          </>
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-300 ${barClassName}`}
            style={{ width: `${barWidth(consumed, target)}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function MacroBarCard({
  proteinConsumed,
  proteinTarget,
  carbsConsumed,
  carbsTarget,
  fatConsumed,
  fatTarget,
  saturatedFatConsumed,
  unsaturatedFatConsumed,
  fiberConsumed,
  fiberTarget,
}: MacroBarCardProps) {
  return (
    <SectionCard title={copy('dashboard.macros.title')}>
      <MacroBarView
        proteinG={proteinConsumed}
        carbsG={carbsConsumed}
        fatG={fatConsumed}
        saturatedFatG={saturatedFatConsumed}
        unsaturatedFatG={unsaturatedFatConsumed}
        fiberG={fiberConsumed}
        className="mb-6"
      />
      <div className="space-y-4">
        <MacroRow
          label={copy('designSystem.macroBar.protein')}
          consumed={proteinConsumed}
          target={proteinTarget}
          barClassName="bg-cs-protein"
        />
        <MacroRow
          label={copy('designSystem.macroBar.carbs')}
          consumed={carbsConsumed}
          target={carbsTarget}
          barClassName="bg-cs-carbs"
        />
        <MacroRow
          label={copy('designSystem.macroBar.fat')}
          consumed={fatConsumed}
          target={fatTarget}
          barClassName="bg-cs-fat"
          subConsumedA={saturatedFatConsumed}
          subConsumedB={unsaturatedFatConsumed}
          subBarClassNameA="bg-cs-fat-saturated rounded-l-full"
          subBarClassNameB="bg-cs-fat-unsaturated rounded-r-full"
          subLabelA="Saturated"
          subLabelB="Unsaturated"
        />
        <MacroRow
          label={copy('common.macro.fiber')}
          consumed={fiberConsumed}
          target={fiberTarget}
          barClassName="bg-cs-success"
        />
      </div>
    </SectionCard>
  );
}

export function MacroBarCardSkeleton() {
  return <SectionCardSkeleton />;
}
