# EDIT-DETAIL-MERGE: Inline Weight Sliders Replace Edit Route

**Status:** Implemented
**Depends on:** IOS-KEYBOARD-VIEWPORT-DEFERRAL.md (root cause analysis), FIXED-BOTTOM-NAV.md (nav-free scan zone + hard reloads)
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Merge the edit flow and detail page onto a single screen, eliminating keyboard-triggered viewport jumps in iOS standalone PWA. The detail page becomes the editor — always showing inline weight sliders and per-item delete controls. No separate edit mode toggle, no text-input weight fields, no keyboard interaction possible during editing.

**Out of scope:** Food name editing (discard and re-scan if wrong), Gemini re-analysis on save, sharing meals.

---

## What shipped

| Area | Implementation |
|------|----------------|
| Shared inline editor card | `components/scanner/EditableFoodItemCard.tsx` — `<input type="range">` slider ±30% of original weight, 1g step, with name, macro summary, and ✕ delete button |
| Weight range helper | `lib/scanner/editable-food-item.ts:itemWeightRange()` — computes `{min, max}` clamped to `[1, …]` |
| Detail page as editor | `app/(app)/log/[mealId]/page.tsx` — loads meal, creates editable items, tracks unsaved work via `useUnsavedWork`, handles save/cancel/delete/confirm-discard/navigation-guard |
| Save/Cancel/Delete/Heart | `components/meal-log/MealDetailActions.tsx` — PrimaryButton save (disabled when no changes or 0 items), Cancel, Delete Meal (destructive), ♥ Save Favorite |
| Detail view with optional editing | `components/meal-log/MealDetailView.tsx` — accepts optional `editableItems`, `totalsOverride`, `onWeightChange`, `onDeleteItem` props; renders `EditableFoodItemCard` when provided, falls back to read-only `FoodItemRowView` |
| Scan results use same card | `components/scanner/MealAnalysisResultView.tsx` — now renders `EditableFoodItemCard` instead of `FoodItemRow` + `FoodItemEditSheet` |
| Scanner hook cleanup | `lib/scanner/use-meal-scanner.ts` — `deleteItem` added; `editingItemId`, `setEditingItemId`, `editItem`, `editingMealId`, `isEditing`, `makeEditMealEntry`, `loadForEditing`, `cancelEdit` removed from return. Internal dead edit state (`editingMealId`, `editingTimestamp`, `existingPhotoStoragePath`, `editBaseline`, `isEditing`) also removed. |
| Log menu simplificiation | `components/meal-log/MealLogRow.tsx` — menu now has View, Delete, ♥ Save Favorite; Edit and Share removed |
| Copy keys cleaned | `lib/copy/scanner.ts` — `scanner.editSheet.*` removed. `lib/copy/meal-log.ts` — `mealLog.share.*`, `mealLog.actions.edit`, `mealLog.actions.share`, `mealLog.actions.sharing`, `mealLog.row.edit` removed. `mealLog.actions.noItems` added. |

**Deleted files:**
- `app/(app)/scan/edit/[mealId]/page.tsx` (separate edit route)
- `components/scanner/FoodItemEditSheet.tsx` (dialog with name + weight text inputs)
- `components/meal-log/MealShareCard.tsx`
- `components/meal-log/use-meal-share-image.ts`
- `tests/unit/meal-share-card.test.ts`

---

## Key decisions

1. **Slider, not text field.** Weight adjustment uses `<input type="range">` with ±30% range, 1g step. Zero keyboard interaction possible. The original weight from Gemini analysis anchors the midpoint.

2. **±30% range.** Chosen as a reasonable portion-adjustment tolerance. Clamped at `max(1, …)` to prevent zero/negative. The range is wide enough for realistic portion corrections but prevents absurd values (e.g., 5000g for an egg).

3. **Names are read-only.** If Gemini misidentified an item, the user discards and re-scans rather than correcting the name. No re-analysis on save. This keeps the edit surface keyboard-free and avoids the complexity of partial Gemini re-runs.

4. **Detail page owns its own edit state.** Unlike the previous design where the scanner hook managed `editingMealId`/`editBaseline`, the detail page (`log/[mealId]/page.tsx`) manages its own `editableItems`, `hasChanges`, and unsaved-work tracking. The scanner hook no longer carries edit state — it only creates new meals.

5. **`window.location.replace` for navigation after delete.** `handleConfirmDelete` uses `router.replace('/log')` (SPA) but the scan page already uses `window.location.replace` for full-page loads. The detail page uses SPA navigation because it stays within the logged-in app shell where the nav bar is reliable (keyboard was never opened).

6. **`Add copy key for hardcoded string added.** The "All items removed — save is disabled. Cancel to restore or delete the meal." string moved from a literal into `mealLog.actions.noItems`.

7. **Dead internal edit state stripped from scanner hook.** `editingMealId`, `editingTimestamp`, `existingPhotoStoragePath`, `editBaseline` state variables, `isEditing` derivation, and related imports (`editBaselineFromState`, `editBaselinesEqual`) were removed. These were never settable after `loadForEditing` was deleted and added ~20 lines of dead branches to `hasUnsavedWork`, `makeMealEntry`, and `discard`.

8. **`MealAnalysisResultView.isEditing` prop removed.** The scan page never passed it, so all conditional button-copy branches for "Save changes"/"Cancel"/no Re-analyze were dead. Removed to reduce confusion.

---

## Architecture & component relationships

```
log/[mealId]/page.tsx
  ├─ useMeal(uid, mealId) → meal, createdAt
  ├─ state: editableItems, hasChanges (JSON-stringify deep compare)
  ├─ useUnsavedWork: registerNavigationHandler (intercept SPA nav), beforeunload
  ├─ MealDetailView
  │    ├─ photo (download URL via getMealPhotoDownloadUrl)
  │    ├─ meal type + timestamp
  │    ├─ totals card (ConfidenceBadge, NutrientStatRow × 3)
  │    └─ items:
  │         ├─ editableItems && handlers → EditableFoodItemCard × N
  │         └─ else → FoodItemRowView × N (read-only fallback)
  ├─ MealDetailActions
  │    ├─ Save (disabled: !hasChanges || itemCount===0 || isSaving)
  │    ├─ Cancel (disabled: !hasChanges) — resets to original meal items
  │    ├─ ♥ Save Favorite (disabled: savedFavorite) — 2s confirmation
  │    ├─ Delete (disabled: isDeleting)
  │    └─ "All items removed" hint when itemCount===0
  ├─ ConfirmAlertDialog (delete confirmation, destructive)
  └─ ConfirmAlertDialog (discard confirmation, destructive)

scan/page.tsx
  └─ useMealScanner → scanner (MealScannerState)
       └─ MealAnalysisResultView
            └─ EditableFoodItemCard × N (same component as detail page)
```

**Shared component:**
```
EditableFoodItemCard
  ├─ props: item, onWeightChange, onDelete
  ├─ : name, macro summary, P/C/F breakdown
  ├─ <input type="range"> (min, max from itemWeightRange(item.originalWeightG))
  ├─ weight display in grams
  └─ ✕ delete button
```

---

## API contract

No API changes. The detail page uses existing mutations:
- `useMeal(uid, mealId)` — reads meal entry
- `useUpdateMeal(uid)` — saves edited entry (sets `isManuallyAdjusted: true`)
- `useDeleteMeal(uid)` — deletes meal, navigates to `/log`
- `useSaveFavorite(uid)` — saves meal as favorite

Weight edits scale macros proportionally client-side via `updateEditableItemWeight`. The server receives the fully computed `FoodItem[]` with updated values — no server-side computation.

---

## Data model

No schema changes. `EditableFoodItem` interface (`lib/scanner/editable-food-item.ts`) extends the existing `FoodItem` concept with:
- `originalWeightG: number` — the weight returned by Gemini (used to anchor the slider range)
- `itemWeightRange(originalWeightG)` — pure function computing `{min, max}`

`editableFoodItemToFoodItem()` converts back to `FoodItem` for Firestore writes. Macro fields are pre-scaled by `updateEditableItemWeight` before conversion — no server-side calculation.

---

## Test status

| Suite | Result |
|-------|--------|
| Unit (`vitest`, non-integration) | 47 files / 254 tests — **pass** |
| Lint | **0 errors** |
| TypeScript (`tsc --noEmit`, production code) | **clean** |
| Production build (`next build --webpack`) | **compiles** |

---

## Edge cases and behavior

| Scenario | Behavior |
|----------|----------|
| All items deleted | Save button disabled; hint text shown: "All items removed…" Cancel restores originals; Delete Meal navigates away |
| Weight slider at min/max | Clamped to `[1, originalWeightG * 0.7]` and `[originalWeightG * 1.3, …]`. Slider step is 1g, cannot drag past bounds |
| Navigation while unsaved changes | `useUnsavedWork.registerNavigationHandler` intercepts; discard dialog shown. "Discard" resets and navigates; "Cancel" stays |
| Page refresh/close with unsaved changes | `beforeunload` event fires browser-native confirm dialog |
| Save succeeds | `setHasUnsavedWork(false)`; `loadedMealIdRef = null` allows re-init on refetch |
| Delete meal | Confirmation dialog (destructive). On confirm → `router.replace('/log')` |
| Favorite save | Heart icon on detail page header + in log menu. "Saved!" text shown for 2s, button disabled during that window |
| Query loading state | `MealDetailSkeleton` variant "detail" displayed |
| Meal not found / load failed | Error state with "Back to log" link — no edit controls rendered |

---

## Next-phase context / notes

- **`edit-baseline.ts` exports `assertScannerEditMode`** — still used by `tests/unit/meal-log-crud.test.ts` but not by any production code. The module also exports `editBaselineFromState`, `editBaselinesEqual`, and `EditBaseline` which are fully unused after the internal state removal. Consider deleting the file in a future cleanup pass.
- **No loading state for photo URL.** `getMealPhotoDownloadUrl` is fetched in a `useEffect` with a `cancelled` flag. While it loads, `photoUrl` is `null` and the "No photo" placeholder renders. No skeleton or spinner was added.
- **Deep compare via `JSON.stringify`.** `hasChanges` compares `editableItems` vs `originalItems` using `JSON.stringify`. Cheap for the expected item count (≤15), but will not detect semantically equivalent objects with different key ordering. Maintainer note: if items grow a nested structure this should switch to a structural equality check.
- **`router.replace` after delete.** The delete handler uses SPA navigation (`router.replace`) rather than `window.location.replace`. This is safe because no text input was involved, so the WKWebView viewport is not deferred. The `useUnsavedWork` navigation interceptor also uses `router.push`.
- **`updateEditableItemWeight` scales macros linearly.** Weight from `100g → 130g` scales calories/protein/carbs/fat/fiber by `×1.3`. This is an approximation — real food density varies. Acceptable for the calorie-tracking use case.

---

## Files changed

**Created:**
- `components/scanner/EditableFoodItemCard.tsx` (61 lines)

**Deleted:**
- `app/(app)/scan/edit/[mealId]/page.tsx` (213 lines)
- `components/scanner/FoodItemEditSheet.tsx` (104 lines)
- `components/meal-log/MealShareCard.tsx` (65 lines)
- `components/meal-log/use-meal-share-image.ts` (67 lines)
- `tests/unit/meal-share-card.test.ts` (12 lines)

**Modified:**
- `app/(app)/log/[mealId]/page.tsx` — full rewrite as inline editor
- `components/meal-log/MealDetailActions.tsx` — save/cancel/delete/heart, copy-key string
- `components/meal-log/MealDetailView.tsx` — optional editing props, conditional EditableFoodItemCard
- `components/meal-log/MealLogRow.tsx` — removed Edit/Share from menu
- `components/scanner/MealAnalysisResultView.tsx` — EditableFoodItemCard instead of FoodItemRow+FoodItemEditSheet; isEditing prop removed
- `lib/scanner/use-meal-scanner.ts` — deleteItem added; editing exports removed; internal dead edit state stripped
- `lib/scanner/editable-food-item.ts` — itemWeightRange helper added
- `lib/copy/scanner.ts` — edit-sheet keys removed
- `lib/copy/meal-log.ts` — share/edit keys removed, noItems key added
