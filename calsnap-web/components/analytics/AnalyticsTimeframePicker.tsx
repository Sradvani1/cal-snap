'use client';

import {
  ANALYTICS_TIMEFRAME_PRESETS,
  type AnalyticsTimeframePreset,
} from '@/lib/analytics/analytics-types';
import { copy, type CopyKey } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';

interface AnalyticsTimeframePickerProps {
  selectedPreset: AnalyticsTimeframePreset;
  onPresetChange: (preset: AnalyticsTimeframePreset) => void;
}

const PRESET_COPY_KEYS: Record<AnalyticsTimeframePreset, CopyKey> = {
  '7D': 'analytics.timeframe.7d',
  '30D': 'analytics.timeframe.30d',
  '90D': 'analytics.timeframe.90d',
  custom: 'analytics.timeframe.custom',
};

export function AnalyticsTimeframePicker({
  selectedPreset,
  onPresetChange,
}: AnalyticsTimeframePickerProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label={copy('analytics.timeframe.a11y')}
    >
      {ANALYTICS_TIMEFRAME_PRESETS.map((preset) => {
        const isSelected = selectedPreset === preset;
        return (
          <button
            key={preset}
            type="button"
            onClick={() => onPresetChange(preset)}
            aria-pressed={isSelected}
            className={cn(
              'min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              isSelected
                ? 'bg-cs-primary text-cs-on-primary'
                : 'border border-cs-border bg-cs-surface text-cs-foreground hover:bg-cs-muted/10',
            )}
          >
            {copy(PRESET_COPY_KEYS[preset])}
          </button>
        );
      })}
    </div>
  );
}
