'use client';

import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

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
        <label className={`${typography.csMacroLabel} flex items-center justify-between`}>
          {copy('settings.units.weightLbs')}
          <input
            type="checkbox"
            checked={useLbsForWeight}
            onChange={(event) => onUseLbsChange(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
        <label className={`${typography.csMacroLabel} flex items-center justify-between`}>
          {copy('settings.units.heightImperial')}
          <input
            type="checkbox"
            checked={useImperialForHeight}
            onChange={(event) => onUseImperialHeightChange(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>
    </SectionCard>
  );
}
