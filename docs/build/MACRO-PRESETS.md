# MACRO-PRESETS: Balanced, More Carbs, and More Protein Quick-Select

**Status:** Implemented
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Give users three one-tap macro split presets instead of requiring manual slider tweaks. The presets are available in both onboarding (choose upfront) and settings (switch later). The preset populates the three macro percentage fields; users can still fine-tune with sliders afterward.

---

## Presets

| Key | Label | Protein | Carbs | Fat |
|-----|-------|---------|-------|-----|
| `balanced` | Balanced | 28% | 47% | 25% |
| `moreCarbs` | More carbs | 25% | 55% | 20% |
| `moreProtein` | More protein | 33% | 42% | 25% |

---

## What shipped

| Area | Implementation |
|------|----------------|
| Preset model | `lib/models/macro-preset.ts` — `MacroPresetKey`, `MacroPresetValues`, `getPresetValues()`, `detectPreset()`, `MACRO_PRESET_KEYS` |
| Shared picker | `components/design/MacroPresetPicker.tsx` — reusable 3-button radio group with `label` prop for accessibility |
| Onboarding state | `lib/onboarding/use-onboarding.ts` — `macroPresetKey` state + `setMacroPresetKey` (updates state, draft, and recalculates targets) |
| Onboarding UI | `components/onboarding/CalorieTargetPreviewStep.tsx` — preset picker above macro gram targets |
| Onboarding save | `lib/onboarding/profile-draft.ts` — optional `macroPresetKey` field on `ProfileDraft`; `lib/repositories/profile.ts` — `makeProfileFromDraft` resolves preset → decimals |
| Settings state | `lib/settings/use-settings-form.ts` — `applyPreset` (exact set, bypasses proportional adjustment) + `detectedPreset` (highlights matching preset) |
| Settings UI | `components/settings/MacroTargetsSection.tsx` — preset picker above sliders; deselects on manual tweak |
| Copy strings | `lib/copy/onboarding.ts` — 5 keys; `lib/copy/settings.ts` — 4 keys |
| Tests | `tests/unit/macro-preset.test.ts` — helper fns; `tests/unit/nutrition-calculator.test.ts` — moreCarbs/moreProtein calc |

---

## Key decisions

1. **Presets are UI convenience, not stored.** Only the resolved macro percentages are persisted to Firestore (`macroTargetProteinPct`, `macroTargetCarbsPct`, `macroTargetFatPct`). The preset key is ephemeral — `detectPreset()` recovers it at load time via exact integer matching. No schema migration needed.

2. **`macroPresetKey` on `ProfileDraft` is optional.** Defaults to `'balanced'` in `makeProfileFromDraft` (line: `draft.macroPresetKey ?? 'balanced'`). This means:
   - Existing code that constructs `ProfileDraft` (e.g. `createDefaultProfileDraft`, `profileDraftFromProfile`, test `fixedDraft`) continues unchanged
   - New onboarding users who pick a preset have it written to the draft by `setMacroPresetKey`, flowing through `saveProfile` → `saveProfileFromDraft` → `makeProfileFromDraft`
   - `profileDraftFromProfile` (settings) never needs the field — settings uses `detectPreset()` on the loaded integer percentages

3. **`applyPreset` sets exact values, bypassing `adjustMacroPercents`.** The `adjustMacroPercents` function redistributes proportionally when one slider changes — correct for manual tweaks. But presets should be exact jumps. So `applyPreset` calls `setMacroProteinPct`, `setMacroCarbsPct`, `setMacroFatPct` directly with the preset's integer values.

4. **`detectPreset` uses exact matching.** If the user drags a slider by even 1%, the preset deselects (returns `null`). This signals "you've customized away from the preset" — intentional UX.

5. **Onboarding `setMacroPresetKey` updates three things atomically:** sets the state key, writes `macroPresetKey` into the `ProfileDraft` (for persistence on save), and recalculates macro gram targets (for immediate display update). The `preset` parameter is passed explicitly to `calculateTargets` so the stale `macroPresetKey` state (due to React batching) is bypassed.

6. **`MacroPresetPicker` accepts an explicit `label` prop** for its `aria-label`. This avoids a mismatch where the shared component would say "Quick preset" in both settings (correct) and onboarding (incorrect — visible label is "Macro split").

---

## Architecture & data flow

```
Preset definitions (lib/models/macro-preset.ts)
  ├─ MACRO_PRESETS["balanced"]   = { proteinPct: 28, carbsPct: 47, fatPct: 25 }
  ├─ MACRO_PRESETS["moreCarbs"]  = { proteinPct: 25, carbsPct: 55, fatPct: 20 }
  └─ MACRO_PRESETS["moreProtein"]= { proteinPct: 33, carbsPct: 42, fatPct: 25 }

┌─ Onboarding flow ───────────────────────────────────────────┐
│                                                             │
│  MacroPresetPicker                                          │
│    └─ onChange → setMacroPresetKey(key)                     │
│         ├─ setMacroPresetKeyState(key)     // state          │
│         ├─ updateDraft(d => d.macroPresetKey = key)  // draft │
│         └─ calculateTargets(draft, key)     // display       │
│                                                             │
│  Save: saveProfile()                                        │
│    └─ draftForSave = { ...profileDraft }  // includes macroPresetKey │
│       └─ saveProfileFromDraft(uid, draftForSave)            │
│          └─ makeProfileFromDraft(draft, uid)                │
│             └─ presetValues = getPresetValues(draft.macroPresetKey ?? 'balanced') │
│                ├─ macroTargetProteinPct = presetValues.proteinPct / 100           │
│                ├─ macroTargetCarbsPct   = presetValues.carbsPct / 100             │
│                └─ macroTargetFatPct     = presetValues.fatPct / 100               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Settings flow ─────────────────────────────────────────────┐
│                                                             │
│  Load: macroIntsFromProfile(profile)                        │
│    └─ Math.round(profile.macroTarget*Pct × 100)            │
│       └─ normalizedMacroPercents(p, c, f)                   │
│                                                             │
│  Detect: detectPreset(proteinPct, carbsPct, fatPct)         │
│    └─ Exact match → MacroPresetKey | null                   │
│                                                             │
│  Apply: applyPreset(key)                                    │
│    └─ const { proteinPct, carbsPct, fatPct } = getPresetValues(key) │
│       ├─ setMacroProteinPct(proteinPct)  // direct set, NOT adjustMacroPercents │
│       ├─ setMacroCarbsPct(carbsPct)                          │
│       └─ setMacroFatPct(fatPct)                              │
│                                                             │
│  User tweaks slider → adjustMacroPercents redistributes     │
│    → detectPreset returns null → picker deselects           │
│                                                             │
│  Save: handleSave()                                         │
│    └─ saveSettingsProfile({ macroProteinPct: form.macroProteinPct, ... }) │
│       └─ applyMacroTargets(profile, pct / 100, ...)         │
│          └─ Firestore persists decimals                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

MacroPresetPicker (components/design/MacroPresetPicker.tsx)
  Used by:
    ├─ CalorieTargetPreviewStep (onboarding, page.tsx → use-onboarding)
    │   └─ label = "Macro split"  (onboarding.calorie.macroPreset)
    └─ MacroTargetsSection (settings, page.tsx → use-settings-form)
        └─ label = "Quick preset" (settings.macro.preset)
```

---

## API contract

**`getPresetValues(key: MacroPresetKey): MacroPresetValues`**

Returns the integer percentages for a given preset key (28/47/25, 25/55/20, or 33/42/25). All values are integers that sum to 100.

**`detectPreset(proteinPct, carbsPct, fatPct): MacroPresetKey | null`**

Exact integer match against `MACRO_PRESETS`. Returns the key if the three values exactly match a preset; `null` otherwise. No fuzzy matching.

**`MacroPresetPicker` component**

```ts
interface MacroPresetPickerProps {
  value: MacroPresetKey | null;  // null = no preset selected (custom)
  label: string;                 // aria-label for the radio group
  onChange: (key: MacroPresetKey) => void;
}
```

**`ProfileDraft` — new optional field**

```ts
export interface ProfileDraft {
  // ... existing fields unchanged ...
  macroPresetKey?: MacroPresetKey;  // optional, defaults to 'balanced'
}
```

---

## Data model

**No Firestore schema changes.** The profile stores the resolved percentages as before:

```
ProfileDoc.macroTargetProteinPct  → decimal (e.g. 0.25 for 25%)
ProfileDoc.macroTargetCarbsPct    → decimal (e.g. 0.55 for 55%)
ProfileDoc.macroTargetFatPct      → decimal (e.g. 0.20 for 20%)
```

`ProfileDraft.macroPresetKey` is ephemeral — used only during onboarding to bridge the UI choice into `makeProfileFromDraft`. It is never written to Firestore.

**No changes to `UserProfile`, `ProfileDoc`, `MacroSplit`, `MealEntry`, `DailyNutritionSummary`, or any analytics types.**

---

## Test status

| Suite | Result |
|-------|--------|
| Unit (`vitest`, 45 files) | **242/242 passed** |
| `macro-preset.test.ts` | 6 tests — preset values, sum=100, exact match, null for non-match, key consistency |
| `nutrition-calculator.test.ts` | 2 new cases — moreCarbs (122/295/43/28g), moreProtein (160/232/54/28g) at 2000 kcal |
| All existing unit tests | 55 existing tests — all pass, zero regressions |
| Lint (ESLint) | **clean** — zero warnings/errors |
| TypeScript (`tsc --noEmit`, app source) | **clean** — zero errors |

---

## Next-phase context / notes

- **Preset labels may wrap on narrow screens.** The picker uses `flex-wrap gap-2` (same as `AnalyticsTimeframePicker`), so three 11–12 char buttons may stack vertically below ~380px viewport. This is acceptable and matches existing patterns.
- **`detectPreset` is exact-match only.** If a future preset (e.g., keto, Mediterranean) is added, the function and `MACRO_PRESET_KEYS` array need expanding. `MacroPresetKey` union type is the single source of truth.
- **No migration path needed** — existing users with balanced (28/47/25) are auto-detected. Users with custom percentages see no preset highlighted, which is correct.
- **The `onboarding.calorie.macroDefaultsNote` copy key** was changed from a hardcoded 28/47/25 message to a generic "Choose a macro split…" message. This avoids incorrect numbers when a non-balanced preset is active.
- **`MacroPresetPicker` uses `as CopyKey` assertions** on line 15–17 of the component file. The keys exist in both `settingsCopy` and `onboardingCopy` with identical values; the assertion is a workaround for the shared picker using settings-specific key constants. If labels diverge in the future, the picker should accept a `labelMap` prop instead.

---

## Files changed

**Created:**
- `calsnap-web/lib/models/macro-preset.ts`
- `calsnap-web/components/design/MacroPresetPicker.tsx`
- `calsnap-web/tests/unit/macro-preset.test.ts`

**Modified:**
- `calsnap-web/lib/onboarding/profile-draft.ts`
- `calsnap-web/lib/repositories/profile.ts`
- `calsnap-web/lib/onboarding/use-onboarding.ts`
- `calsnap-web/components/onboarding/CalorieTargetPreviewStep.tsx`
- `calsnap-web/app/(onboarding)/onboarding/page.tsx`
- `calsnap-web/lib/settings/use-settings-form.ts`
- `calsnap-web/components/settings/MacroTargetsSection.tsx`
- `calsnap-web/app/(app)/settings/page.tsx`
- `calsnap-web/lib/copy/onboarding.ts`
- `calsnap-web/lib/copy/settings.ts`
- `calsnap-web/tests/unit/nutrition-calculator.test.ts`
