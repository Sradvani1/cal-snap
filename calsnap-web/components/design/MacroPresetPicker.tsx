'use client';

import type { CopyKey } from '@/lib/copy';
import { copy } from '@/lib/copy';
import type { MacroPresetKey } from '@/lib/models/macro-preset';
import { MACRO_PRESET_KEYS } from '@/lib/models/macro-preset';
import { cn } from '@/lib/utils/cn';

interface MacroPresetPickerProps {
  value: MacroPresetKey | null;
  label: string;
  onChange: (key: MacroPresetKey) => void;
}

const PRESET_COPY_KEYS: Record<MacroPresetKey, CopyKey> = {
  moreCarbs: 'settings.macro.preset.moreCarbs' as CopyKey,
  balanced: 'settings.macro.preset.balanced' as CopyKey,
  moreProtein: 'settings.macro.preset.moreProtein' as CopyKey,
};

export function MacroPresetPicker({ value, label, onChange }: MacroPresetPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {MACRO_PRESET_KEYS.map((key) => {
        const isSelected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(key)}
            className={cn(
              'min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary focus-visible:ring-offset-2',
              isSelected
                ? 'bg-cs-primary text-cs-on-primary'
                : 'border border-cs-border bg-cs-surface text-cs-foreground hover:bg-cs-muted/10',
            )}
          >
            {copy(PRESET_COPY_KEYS[key])}
          </button>
        );
      })}
    </div>
  );
}
