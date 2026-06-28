import { copy } from '@/lib/copy';

import type { MacroSplit } from '@/lib/models/macro-split';

export function formatMacroSplitCaption(actual: MacroSplit, target: MacroSplit): string {
  return copy('dashboard.summary.macroSplit', {
    actualProtein: actual.proteinPct,
    actualCarbs: actual.carbsPct,
    actualFat: actual.fatPct,
    targetProtein: target.proteinPct,
    targetCarbs: target.carbsPct,
    targetFat: target.fatPct,
  });
}

export function macroSplitAccessibilityLabel(actual: MacroSplit, target: MacroSplit): string {
  return copy('dashboard.summary.macroSplitA11y', {
    actualProtein: actual.proteinPct,
    actualCarbs: actual.carbsPct,
    actualFat: actual.fatPct,
    targetProtein: target.proteinPct,
    targetCarbs: target.carbsPct,
    targetFat: target.fatPct,
  });
}
