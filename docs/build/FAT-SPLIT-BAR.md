# FAT-SPLIT-BAR: Saturated/Unsaturated Fat Opacity Split on Macro Bar

**Status:** Implemented
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Split the fat segment of the dashboard macro bar into saturated and unsaturated fat using opacity — a darker shade for saturated fat (80% opacity) and a lighter shade for unsaturated fat (40% opacity). When split data is unavailable (old meals, Gemini doesn't return it), the bar falls back to rendering a solid fat segment.

---

## What shipped

| Area | Implementation |
|------|----------------|
| Gemini prompt | All 3 prompt variants (image-only, image+description, description-only) now request `saturated_fat_g` and `unsaturated_fat_g` alongside the existing `fat_g` total |
| Gemini JSON schema | `meal-analysis-schema.ts` — `saturated_fat_g` and `unsaturated_fat_g` added as required `number` fields to both item schema and `meal_total` schema |
| Gemini response parsing | `meal-analysis-zod.ts` — normalizer fills missing fields via `asNumber()` → 0; Zod schemas include new fields; `parseMealAnalysisResponse` maps them to camelCase |
| Domain models | `FoodItem` and `MealEntry` now carry `saturatedFatG`/`unsaturatedFatG` and `totalSaturatedFatG`/`totalUnsaturatedFatG` alongside the existing `fatG`/`totalFatG` |
| Firestore schemas | `FoodItemDoc` and `MealEntryDoc` extended with the new fields; all 5 mappers (`mealDocToEntry`, `mealEntryToDoc`, `mealEntryToUpdateDoc`, `foodItemDocToEntry`, `foodItemToDoc`) updated; `mealDocToEntry` and `foodItemDocToEntry` use `?? 0` for backward-compatible reads of old documents |
| Favorite log flow | `favoriteToMealEntry` computes `totalSaturatedFatG`/`totalUnsaturatedFatG` from `FavoriteMeal.items[]` via `reduce()` — no new fields on `FavoriteMeal` Firestore doc |
| Manual weight adjustment | `updateEditableItemWeight` scales `saturatedFatG` and `unsaturatedFatG` by the same ratio as all other macros |
| Scanner & edit flows | `useMealScanner.makeMealEntry`, `log/[mealId]/page.tsx` `handleSave` — new totals mapped through |
| Aggregation | `aggregateTodaysMeals`, `loggedDailySummaries`, `chartDailySeries` — sum and zero-fill the new fields in `AggregatedMeals` and `DailyNutritionSummary` |
| Dashboard hook | `useDashboard` exposes `saturatedFatConsumed` and `unsaturatedFatConsumed` from aggregation |
| MacroBarView | Accepts optional `saturatedFatG`/`unsaturatedFatG` props (default 0); renders opacity split when sum > 0, solid fallback when 0; width calculation uses percentage of total bar |
| MacroBarCard | Accepts `saturatedFatConsumed`/`unsaturatedFatConsumed` props and passes to `MacroBarView` |
| Dashboard page | Wires `dashboard.saturatedFatConsumed` and `dashboard.unsaturatedFatConsumed` to `MacroBarCard` |
| CSS | `--cs-fat-saturated` (rgba 80% opacity) and `--cs-fat-unsaturated` (rgba 40% opacity) in `:root`, dark mode `@media`, and `.dark` class; registered in `@theme inline` block for Tailwind utility generation |
| Tests | Updated 9 test files + JSON fixture; added `saturatedFatG`/`unsaturatedFatG` to all object literals, scaling assertions, and normalizer default tests |

---

## Key decisions

1. **Opacity split, not new colors.** Using the same purple base (`#af52de` light / `#bf5af2` dark) with different opacities (80% saturated, 40% unsaturated) creates a visual texture distinction without introducing a new color palette. Users with some forms of color blindness can still perceive the split because of opacity difference rather than hue difference alone.

2. **Nested fat segment, not a separate bar.** The saturated/unsaturated segments are children of the existing fat bar segment. The outer segment width is determined by `fatG` (total fat), and the inner segments by `saturatedFatG`/`unsaturatedFatG`. If the split sums don't match `fatG` (Gemini rounding), the visual shows a gap/overflow within the fat section — honest to the data, avoids fabricated corrections.

3. **`totalFatG` remains authoritative for all calorie math.** `fatG * 9` is used for `macroPercents()`, `totalCalories` validation, and the analytics `macroSplit`. The new fields are visual-only — they never feed into calorie calculations.

4. **No validation that `saturated + unsaturated === total`.** Gemini may return slightly mismatched sums due to rounding. Adding validation would cause parse failures for minor discrepancies. The visual bar handles mismatches transparently (gap or overflow).

5. **`?? 0` fallback on Firestore reads, not writes.** `mealDocToEntry` and `foodItemDocToEntry` default to 0 for old documents that lack the new fields. Write mappers (`mealEntryToDoc`, `foodItemToDoc`) pass through directly — the source `MealEntry`/`FoodItem` always has the field (defaults to 0 for old data after read).

6. **FavoriteMeal does NOT gain meal-level split fields.** The split data survives in `FavoriteMeal.items[]` (each `FoodItem` carries `saturatedFatG`/`unsaturatedFatG`). When logging from a favorite, `favoriteToMealEntry` computes the meal-level totals via `reduce()`. This avoids a Firestore schema change on the favorites collection.

7. **Zod schemas require the new fields.** The normalizer always produces values (via `asNumber()` defaulting to 0), so requiring them in the schema is safe. If Gemini changes its response format and stops returning these fields, the Zod error is a loud signal to fix the prompt, not a silent data loss.

---

## Architecture & data flow

```
Gemini API response
  ├─ items[].saturated_fat_g   ──► MealAnalysisFoodItemResult.saturatedFatG
  ├─ items[].unsaturated_fat_g ──► MealAnalysisFoodItemResult.unsaturatedFatG
  ├─ meal_total.saturated_fat_g   ──► MealAnalysisMealTotal.saturatedFatG
  └─ meal_total.unsaturated_fat_g ──► MealAnalysisMealTotal.unsaturatedFatG

parseMealAnalysisResponse (normalizer → Zod → camelCase)
  ├─ FoodItem.saturatedFatG / unsaturatedFatG
  └─ MealEntry.totalSaturatedFatG / totalUnsaturatedFatG

Firestore (users/{uid}/meals/{mealId})
  ├─ FoodItemDoc.saturatedFatG / unsaturatedFatG
  └─ MealEntryDoc.totalSaturatedFatG / totalUnsaturatedFatG
      └─ Read via ?? 0 for backward compat

Aggregation chain:
  └─ meal.totalSaturatedFatG ──► aggregateTodaysMeals → todaysSaturatedFatG
  └─ meal.totalUnsaturatedFatG ─► aggregateTodaysMeals → todaysUnsaturatedFatG
     └─ useDashboard → saturatedFatConsumed / unsaturatedFatConsumed
        └─ MacroBarCard → MacroBarView

MacroBarView (UI)
  ├─ saturatedFatG + unsaturatedFatG > 0
  │    ├─ <div className="bg-cs-fat-saturated" />  (80% opacity)
  │    └─ <div className="bg-cs-fat-unsaturated" /> (40% opacity)
  └─ else
       └─ <div className="bg-cs-fat" />  (solid, backward compat)

Favorite flow:
  └─ FavoriteMeal.items[].saturatedFatG / unsaturatedFatG  (no meal-level fields)
     └─ favoriteToMealEntry → reduce(items) → totalSaturatedFatG / totalUnsaturatedFatG
```

---

## API contract

**New Gemini response fields** (JSON schema, snake_case):

```json
{
  "items": [
    {
      "saturated_fat_g": 3,
      "unsaturated_fat_g": 7
    }
  ],
  "meal_total": {
    "saturated_fat_g": 5,
    "unsaturated_fat_g": 11
  }
}
```

Both fields are required in the Zod schema. The normalizer fills them with 0 if Gemini omits them.

**`MacroBarView` new props** (optional):

```ts
interface MacroBarViewProps {
  saturatedFatG?: number;    // default 0
  unsaturatedFatG?: number;  // default 0
}
```

**`useDashboard` new return fields:**

```ts
{
  saturatedFatConsumed: number;
  unsaturatedFatConsumed: number;
}
```

---

## Data model

**New Firestore fields** (all numeric, grams):

| Collection | Document | New fields |
|-----------|----------|------------|
| `users/{uid}/meals/{mealId}` | `MealEntryDoc` | `totalSaturatedFatG`, `totalUnsaturatedFatG` |
| `users/{uid}/meals/{mealId}.items[]` | `FoodItemDoc` | `saturatedFatG`, `unsaturatedFatG` |

Existing `totalFatG` and `fatG` fields are **retained** — they remain the canonical values for all calorie math.

**No schema change on:** `FavoriteMealDoc`, `UserProfile`, `WeighInDoc`.

**No migration required.** Old documents read with `?? 0` for new fields.

---

## CSS contract

```css
/* Tailwind v4 @theme inline registration */
--color-cs-fat-saturated: var(--cs-fat-saturated);
--color-cs-fat-unsaturated: var(--cs-fat-unsaturated);

/* Light mode */
--cs-fat-saturated: rgba(175, 82, 222, 0.8);
--cs-fat-unsaturated: rgba(175, 82, 222, 0.4);

/* Dark mode */
--cs-fat-saturated: rgba(191, 90, 242, 0.8);
--cs-fat-unsaturated: rgba(191, 90, 242, 0.4);
```

Both variables are defined in `:root`, `@media (prefers-color-scheme: dark) :root`, and `.dark` class for snapshot testing.

---

## Test status

| Suite | Result |
|-------|--------|
| Unit (`vitest`) | 47 files / 254 tests — **all pass** |
| Lint (`eslint`) | **clean** |
| TypeScript (`tsc --noEmit`) | **no new errors** |
| Build (`next build --webpack`) | **succeeds**; CSS output verified to contain `.bg-cs-fat-saturated` and `.bg-cs-fat-unsaturated` |
| Integration (emulators) | **not run** (not affected — rules are auth-only) |

Key test assertions added:
- `editable-food-item.test.ts` — scaling saturated/unsaturated with weight change
- `meal-totals.test.ts` — `sumEditableItems` verifies `totalSaturatedFatG` and `totalUnsaturatedFatG`
- `meal-analysis-zod-normalize.test.ts` — verify missing fields default to 0

---

## Next-phase context

- **Saturated/unsaturated targets** — The `macroTargets()` function computes only `fatG` (total fat grams). WHO guidelines recommend saturated fat < 10% of calories. Adding a target threshold for saturated fat would require UX decisions (warn when exceeding, or a separate target bar). Out of scope for this phase.

- **Detail page tap-through** — Planned: each macro row in `MacroBarCard` will navigate to a detail view showing which food items contributed to that macro. The saturated/unsaturated split will be visible on the fat detail page.

- **CSV export** — The `makeCSV` function and header at `lib/services/data-export.ts` do not include saturated/unsaturated columns. This should be added when the detail view is built so the exported data matches the in-app view.

- **Display components** — `FoodItemRowView`, `EditableFoodItemCard`, `FavoriteCard`, and `DailySummaryBar` display `fatG` as a single number. They should show the split when the detail tap-through is implemented.

- **Analytics insight** — `buildAnalyticsSnapshot` uses `totalFat` for `macroSplit` calculation (calorie-based). Saturated/unsaturated data is aggregated into `DailyNutritionSummary` but not yet surfaced in the insight payload. This can be added when insight generation references fat quality.

- **Old meals display solid bar** — This is by design. If a user edits an old meal, the split remains 0 (0 × ratio = 0) and the bar renders solid. No fabricated data.

---

## Files changed (35 total)

**Production (22):**
`lib/gemini/meal-analysis-prompt.ts`, `lib/gemini/meal-analysis-schema.ts`, `lib/gemini/meal-analysis-types.ts`, `lib/gemini/meal-analysis-zod.ts`, `lib/models/food-item.ts`, `lib/models/meal-entry.ts`, `lib/models/meal-entry-doc.ts`, `lib/models/food-item-doc.ts`, `lib/scanner/editable-food-item.ts`, `lib/scanner/meal-totals.ts`, `lib/scanner/use-meal-scanner.ts`, `lib/scanner/edit-baseline.ts`, `app/(app)/log/[mealId]/page.tsx`, `lib/dashboard/aggregate-meals.ts`, `lib/analytics/analytics-types.ts`, `lib/analytics/analytics-aggregator.ts`, `lib/queries/use-dashboard.ts`, `lib/queries/use-log-from-favorite.ts`, `components/design/MacroBarView.tsx`, `components/dashboard/MacroBarCard.tsx`, `app/(app)/dashboard/page.tsx`, `app/globals.css`

**Tests (13):**
`tests/unit/editable-food-item.test.ts`, `tests/unit/model-mappers.test.ts`, `tests/unit/meal-log-crud.test.ts`, `tests/unit/analytics-aggregator.test.ts`, `tests/unit/dashboard-aggregation.test.ts`, `tests/unit/data-export.test.ts`, `tests/unit/analyze-meal-route.test.ts`, `tests/unit/use-save-favorite.test.ts`, `tests/unit/use-log-from-favorite.test.ts`, `tests/unit/use-log-meal.test.ts`, `tests/unit/favorite-meal-doc.test.ts`, `tests/unit/fixtures/meal-analysis.json`, `tests/unit/meal-analysis-zod-normalize.test.ts`
