'use client';

import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';

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
    <SettingsSectionCard title="Units">
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700">Weight in pounds</span>
          <input
            type="checkbox"
            checked={useLbsForWeight}
            onChange={(event) => onUseLbsChange(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700">Height in feet and inches</span>
          <input
            type="checkbox"
            checked={useImperialForHeight}
            onChange={(event) => onUseImperialHeightChange(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>
    </SettingsSectionCard>
  );
}
