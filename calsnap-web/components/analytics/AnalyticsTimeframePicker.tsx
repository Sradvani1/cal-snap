'use client';

import {
  ANALYTICS_TIMEFRAME_PRESETS,
  type AnalyticsTimeframePreset,
} from '@/lib/analytics/analytics-types';

interface AnalyticsTimeframePickerProps {
  selectedPreset: AnalyticsTimeframePreset;
  onPresetChange: (preset: AnalyticsTimeframePreset) => void;
}

const PRESET_LABELS: Record<AnalyticsTimeframePreset, string> = {
  '7D': '7D',
  '30D': '30D',
  '90D': '90D',
  custom: 'Custom',
};

export function AnalyticsTimeframePicker({
  selectedPreset,
  onPresetChange,
}: AnalyticsTimeframePickerProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Analytics timeframe"
    >
      {ANALYTICS_TIMEFRAME_PRESETS.map((preset) => {
        const isSelected = selectedPreset === preset;
        return (
          <button
            key={preset}
            type="button"
            onClick={() => onPresetChange(preset)}
            aria-pressed={isSelected}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              isSelected
                ? 'bg-neutral-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {PRESET_LABELS[preset]}
          </button>
        );
      })}
    </div>
  );
}
