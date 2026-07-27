'use client';

import { useState, useCallback } from 'react';
import {
  AnalyticsDateRange,
  normalizeCustomRange,
  presetToDateRange,
  type AnalyticsTimeframePreset,
} from '@/lib/analytics/analytics-types';

export function useAnalyticsTimeframe() {
  const [timeframePreset, setTimeframePreset] = useState<AnalyticsTimeframePreset>('7D');
  const [selectedRange, setSelectedRange] = useState(() => AnalyticsDateRange.days(7));
  const [presetBeforeCustom, setPresetBeforeCustom] = useState<AnalyticsTimeframePreset>('7D');
  const [customSheetOpen, setCustomSheetOpen] = useState(false);

  const handlePresetChange = useCallback(
    (preset: AnalyticsTimeframePreset) => {
      if (preset === 'custom') {
        setPresetBeforeCustom(timeframePreset === 'custom' ? '7D' : timeframePreset);
        setTimeframePreset('custom');
        setCustomSheetOpen(true);
        return;
      }
      setTimeframePreset(preset);
      setSelectedRange(presetToDateRange(preset));
    },
    [timeframePreset],
  );

  const handleCustomApply = useCallback(
    (start: Date, end: Date) => {
      const normalized = normalizeCustomRange(start, end);
      if (normalized.kind === 'custom') {
        setSelectedRange(normalized);
        setTimeframePreset('custom');
      }
      setCustomSheetOpen(false);
    },
    [],
  );

  const revertCustomPresetIfNeeded = useCallback(() => {
    setTimeframePreset((current) => {
      if (current !== 'custom') return current;
      return presetBeforeCustom;
    });
    setSelectedRange((current) => {
      if (current.kind !== 'custom') return current;
      return presetToDateRange(presetBeforeCustom);
    });
    setCustomSheetOpen(false);
  }, [presetBeforeCustom]);

  return {
    timeframePreset,
    selectedRange,
    customSheetOpen,
    handlePresetChange,
    handleCustomApply,
    revertCustomPresetIfNeeded,
  };
}
