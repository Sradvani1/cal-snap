'use client';

import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface UnitsSectionProps {
  useLbsForWeight: boolean;
  useImperialForHeight: boolean;
  onUseLbsChange: (value: boolean) => void;
  onUseImperialHeightChange: (value: boolean) => void;
}

export function UnitsSection({
  useLbsForWeight,
  useImperialForHeight,
  onUseLbsChange,
  onUseImperialHeightChange,
}: UnitsSectionProps) {
  return (
    <SectionCard title={copy('settings.section.units')}>
      <div className="flex flex-col gap-3">
        <label
          className={cn(
            typography.csMacroLabel,
            'flex min-w-0 items-center justify-between gap-3',
          )}
        >
          {copy('settings.units.weightLbs')}
          <input
            type="checkbox"
            checked={useLbsForWeight}
            onChange={(event) => onUseLbsChange(event.target.checked)}
            className="h-4 w-4 shrink-0"
          />
        </label>
        <label
          className={cn(
            typography.csMacroLabel,
            'flex min-w-0 items-center justify-between gap-3',
          )}
        >
          {copy('settings.units.heightImperial')}
          <input
            type="checkbox"
            checked={useImperialForHeight}
            onChange={(event) => onUseImperialHeightChange(event.target.checked)}
            className="h-4 w-4 shrink-0"
          />
        </label>
      </div>
    </SectionCard>
  );
}
