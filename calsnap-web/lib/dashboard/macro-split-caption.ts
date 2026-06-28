import type { MacroSplit } from '@/lib/models/macro-split';

export function formatMacroSplitCaption(actual: MacroSplit, target: MacroSplit): string {
  return `Actual P/C/F: ${actual.proteinPct}/${actual.carbsPct}/${actual.fatPct}% · Target: ${target.proteinPct}/${target.carbsPct}/${target.fatPct}%`;
}

export function macroSplitAccessibilityLabel(actual: MacroSplit, target: MacroSplit): string {
  return `Actual macros protein ${actual.proteinPct} percent, carbs ${actual.carbsPct} percent, fat ${actual.fatPct} percent. Target protein ${target.proteinPct} percent, carbs ${target.carbsPct} percent, fat ${target.fatPct} percent.`;
}
