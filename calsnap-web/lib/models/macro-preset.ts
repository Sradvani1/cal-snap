export type MacroPresetKey = 'balanced' | 'moreCarbs' | 'moreProtein';

export interface MacroPresetValues {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export const MACRO_PRESETS: Record<MacroPresetKey, MacroPresetValues> = {
  balanced: { proteinPct: 28, carbsPct: 47, fatPct: 25 },
  moreCarbs: { proteinPct: 25, carbsPct: 55, fatPct: 20 },
  moreProtein: { proteinPct: 33, carbsPct: 42, fatPct: 25 },
};

export const MACRO_PRESET_KEYS: MacroPresetKey[] = ['moreCarbs', 'balanced', 'moreProtein'];

export function getPresetValues(key: MacroPresetKey): MacroPresetValues {
  return MACRO_PRESETS[key];
}

export function detectPreset(
  proteinPct: number,
  carbsPct: number,
  fatPct: number,
): MacroPresetKey | null {
  const entry = Object.entries(MACRO_PRESETS).find(
    ([, v]) =>
      v.proteinPct === proteinPct && v.carbsPct === carbsPct && v.fatPct === fatPct,
  );
  return (entry?.[0] as MacroPresetKey) ?? null;
}
