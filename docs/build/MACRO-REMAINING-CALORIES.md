# MACRO-REMAINING-CALORIES: Accurate Macro Targets with Fiber-Adjusted Calorie Pool

**Status:** Implemented
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Eliminate the circular logic in macro target calculations caused by fiber yielding 2 kcal/g while being grouped with carbohydrates (4 kcal/g). Instead of allocating the full daily calorie pool using user P/C/F percentages and dividing by cal-per-gram, the new "remaining calories" method:

1. Calculates fiber grams first (14 g per 1000 kcal)
2. Deducts fiber's actual caloric contribution (2 kcal/g) from the pool
3. Allocates the remaining calories via the user's P/C/F percentages divided by 4, 4, and 9
4. Returns `totalCarbsG = netCarbsG + fiberG` for display, alongside a separate `fiberG` field

Fiber's established caloric value (2 kcal/g) is now surfaced explicitly in the return type alongside the other macros.

---

## What shipped

| Area | Implementation |
|------|----------------|
| Core calculator | `lib/nutrition/calculator.ts` — `macroTargets()` rewritten to remaining-calories method; deduplicated via `fiberTargetG()` as single source of truth |
| Return type | `{ proteinG, totalCarbsG, fatG, fiberG }` replaces `{ proteinG, carbsG, fatG }` |
| Dashboard hook | `lib/queries/use-dashboard.ts` — fiber target consolidated into `macros.fiberG`; dead import removed |
| Dashboard page | `app/(app)/dashboard/page.tsx` — mapped new fields to `MacroBarCard` props |
| Onboarding | `lib/onboarding/use-onboarding.ts` — `OnboardingTargets` updated with `totalCarbsG` + `fiberG` |
| Onboarding preview | `components/onboarding/CalorieTargetPreviewStep.tsx` — 4-column grid includes fiber target |
| Dead code cleanup | `lib/dashboard/calorie-progress.ts` — removed `fiberTargetForDailyCalories()` and `fiberProgressRatio()` |
| Tests | Updated expected values in `nutrition-calculator.test.ts` and `dashboard-aggregation.test.ts` |

---

## Key decisions

1. **`fiberTargetG()` retained as standalone export.** The analytics pipeline imports it directly for threshold comparisons (`daysMeetingFiberTarget`). Rather than duplicating the formula, `macroTargets()` now calls `fiberTargetG()` internally, using the unrounded float for the calorie tax and rounding only the returned value for display. This ensures a single source of truth.

2. **`totalCarbsG` replaces `carbsG` in return type.** The display-facing value includes fiber grams. The distinction is important: `totalCarbsG = netCarbsG + fiberG`. Downstream components showing a "carbs" target now show total carbohydrates, consistent with how logged meal data stores `totalCarbsG`.

3. **`fiberG` surfaced in `macroTargets` return.** Previously fiber target was computed separately via `fiberTargetForDailyCalories()`. Consolidating it into `macroTargets()` simplifies the one call site (dashboard hook) that needs both macro targets and fiber target for the same calorie value.

4. **Dead code removed immediately.** `fiberTargetForDailyCalories()` (only used by dashboard hook, now consolidated) and `fiberProgressRatio()` (zero callers) were deleted rather than left as confusing orphaned utilities.

5. **Rounding order:** `totalCarbsG = round(netCarbs) + round(fiberG)` rather than `round(netCarbs + fiberG)`. The difference is sub-gram at realistic calorie levels, but individual rounding keeps each component's contribution transparent.

---

## Architecture & data flow

```
Profile (Firestore)
  ├─ macroTargetProteinPct (0.28)
  ├─ macroTargetCarbsPct   (0.47)
  ├─ macroTargetFatPct     (0.25)
  └─ dailyCalorieTarget    (e.g. 2000)

macroTargets(dailyCal, proteinPct, carbsPct, fatPct)
  ├─ fiberG = fiberTargetG(dailyCal)         // shared formula
  ├─ fiberCal = fiberG × 2                   // fiber kcal/g
  ├─ remainingCal = dailyCal − fiberCal       // pool for 4-4-9
  ├─ proteinG = round(remainingCal × pct / 4)
  ├─ netCarbsG = round(remainingCal × pct / 4)
  ├─ totalCarbsG = netCarbsG + round(fiberG)
  ├─ fatG = round(remainingCal × pct / 9)
  └─ returns { proteinG, totalCarbsG, fatG, fiberG }

Consumers:
  ├─ Dashboard (use-dashboard.ts → MacroBarCard)
  │   └─ .proteinG → proteinTarget
  │   └─ .totalCarbsG → carbsTarget
  │   └─ .fatG → fatTarget
  │   └─ .fiberG → fiberTarget
  │
  └─ Onboarding (use-onboarding.ts → CalorieTargetPreviewStep)
      └─ .proteinG, .totalCarbsG, .fatG, .fiberG → 4-column grid

Analytics (separate path):
  └─ fiberTargetG(dailyCal) → threshold for daysMeetingFiberTarget
```

---

## API contract

**`macroTargets(dailyCalories, proteinPct, carbsPct, fatPct)`**

No change to function signature. Return type expanded:

```ts
// Before:
{ proteinG: number; carbsG: number; fatG: number }

// After:
{ proteinG: number; totalCarbsG: number; fatG: number; fiberG: number }
```

All values are `Math.round`-ed integers suitable for display.

**`fiberTargetG(dailyCalorieTarget)`** — unchanged. Returns raw float. Analytics uses this for threshold comparison (not display).

---

## Data model

**No Firestore schema changes.** The profile's stored `macroTargetProteinPct`, `macroTargetCarbsPct`, `macroTargetFatPct` fields (decimal percentages) are unchanged. The computation changed, not the storage.

`MacroSplit` interface and `macroPercents()` reverse calculator are unchanged.

---

## Test status

| Suite | Result |
|-------|--------|
| Unit (`vitest`, non-integration) | 44 files / 234 tests — **pass** |
| `nutrition-calculator.test.ts` | `macroTargets`/`macroPercents` updated — **pass** |
| `dashboard-aggregation.test.ts` | fiber target test redirected — **pass** |
| TypeScript (`tsc --noEmit`) | **clean** (pre-existing integration test errors unrelated) |

---

## Next-phase context / notes

- **Analytics `fiberTargetG` vs dashboard `fiberG`:** Both compute the same formula (14 g / 1000 kcal), but analytics uses the raw float as a threshold while dashboard displays the rounded integer. This is intentional — threshold comparisons benefit from precision, UI benefits from clean numbers.
- **No migration needed** — the Firestore profile values are unaffected. Only the in-memory computation changed.
- **Onboarding shows fiber target** for the first time. Previously fiber was only shown on the dashboard. The 4-column grid (`grid-cols-4`) fits comfortably at onboarding's typical viewport widths.
- **`macroPercents()` roundtrip no longer exact:** Passing the new `macroTargets` output into `macroPercents()` produces slightly different percentages (e.g. 26/50/24 vs input 28/47/25) because fiber's 2 kcal/g contribution shifts the total caloric ratio when all carbs (including fiber) are counted at 4 kcal/g. This is correct — the roundtrip was never an invariant, just a validation of the arithmetic.

---

## Files changed

**Modified:** `calsnap-web/lib/nutrition/calculator.ts`, `calsnap-web/lib/queries/use-dashboard.ts`, `calsnap-web/app/(app)/dashboard/page.tsx`, `calsnap-web/lib/onboarding/use-onboarding.ts`, `calsnap-web/components/onboarding/CalorieTargetPreviewStep.tsx`, `calsnap-web/lib/dashboard/calorie-progress.ts`, `calsnap-web/tests/unit/nutrition-calculator.test.ts`, `calsnap-web/tests/unit/dashboard-aggregation.test.ts`
