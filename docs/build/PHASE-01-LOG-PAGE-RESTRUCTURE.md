# Historical Phase 1: Log Page Restructure

> **Historical archive:** Completed implementation notes moved from the app-local documentation tree.

## Summary

Restructured the Log page around reusability and friction reduction. Replaced the old two-tab layout (Log/Favorites) with Favorites and History tabs, unified the bottom-sheet interaction pattern across the app, removed item-level favoriting and the Build tab, and added quick delete + fave toggle to the Dashboard.

---

## What Was Built

### Log Page — Two Tabs

```
┌───────────────┬───────────────┐
│   Favorites   │   Log         │
├───────────────┴───────────────┤
│   {tab content}              │
└───────────────────────────────┘
```

**Favorites tab** — Ranked list of all saved meals (single-items and multi-item meals in one `favorites` collection). Tap a row → opens bottom sheet with Log + Delete buttons and MealTypeSelector.

**History tab** — Daily meal log with DateNavBar (same as old Log tab). Meal rows grouped by meal type. Add-meal `+` buttons link to `/scan?mealType=...`. Tap a row → opens bottom sheet with Star (fave toggle) + View + Delete buttons.

### Shared Bottom Sheet (MealQuickLookSheet)

A single Vaul Drawer component used in three contexts:

| Context | Star | MealType | Log | View | Delete |
|---------|------|----------|-----|------|--------|
| **Favorites tab** | hidden | shown | shown | hidden | shown |
| **History tab** | shown | hidden | hidden | shown | shown |
| **Dashboard** | shown | shown | hidden | hidden | shown |

All items show name, calories, weight, and expandable range slider for weight adjustment. Macro pills (P/C/F/Fiber) shown below items.

### Star Fave Toggle (upper right)

☆/★ button positioned in the upper right corner of the sheet, matching the meal detail page pattern. Toggles the meal as a favorite by checking `originalMealId`. Local `faveClicked` state provides instant visual feedback (no need to wait for query invalidation). Button stays open — no close, no redirect.

### Dashboard Delete

Meal rows in the Dashboard open the same bottom sheet. A Delete button opens a confirmation dialog. Deletes the meal from Firestore and refreshes the meals query.

### DailySummaryBar

Added fiber to the daily total display alongside protein, carbs, and fat.

---

## Removed

| Feature | Reason |
|---------|--------|
| **Build tab** | Users don't build meals — they scan and log |
| **Item-level favoriting (☆ on items)** | Too granular. Items cannot be saved independently. Users can scan a single item and favorite the resulting meal |
| **`savedItems` collection** | Replaced by single `favorites` collection — single-item favorites are just `FavoriteMeal` with 1 item |
| **One-tap logging** | Replaced by modal interaction (tap → sheet → adjust → Log) |
| **Kelob menus** | Replaced by in-sheet actions (Delete, Rename deferred) |
| **Favorites header** | Redundant — the tab title speaks for itself |

---

## Data Model

### Favorites (unchanged, but unified)

```
users/{uid}/favorites/{favoriteId}
```

`FavoriteMeal` now has `useCount: number` and `lastUsedAt: Date | null` for usage-based ranking. A "saved item" is just a `FavoriteMeal` with `items.length === 1`.

Single-item saves use `id: crypto.randomUUID()` for the MealEntry, so `originalMealId` won't match any source meal — the star on the meal detail page only reflects full-meal saves.

### Ranking

Both favorites and saved items (historical) are sorted by `useCount DESC → lastUsedAt DESC → createdAt DESC`. In-memory sort — no Firestore composite indexes needed.

---

## Architecture

### Component Relationships

```
LogPage
├─ TabButton (Favorites / History)
├─ [Favorites tab]
│  └─ FavoritesGrid → FavoriteMealRow → tap → page-level MealQuickLookSheet
├─ [History tab]
│  ├─ DateNavBar
│  ├─ MealListSection → MealLogRow → tap → onOpenSheet → page-level MealQuickLookSheet
│  └─ DailySummaryBar
└─ MealQuickLookSheet (shared page-level instance)

DashboardPage
└─ TodaysMealsSection → MealListSection → MealLogRow
   └─ MealQuickLookSheet (internal, per-row)
      ├─ Star (onFavorite + isFavorited)
      ├─ MealTypeSelector
      ├─ Weight sliders
      └─ Delete button
```

### Key Props

**MealQuickLookSheet** (shared component):
```ts
interface MealQuickLookSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealEntry | null;
  skipAutoSave?: boolean;
  onLogForToday?: (items: FoodItem[], mealType: MealType) => void;
  isLogging?: boolean;
  onFavorite?: () => void;
  onDeleteMeal?: (meal: MealEntry) => void;
  viewHref?: string;
  isFavorited?: boolean;
  hideMealType?: boolean;
}
```

**MealLogRow** (added props):
- `onOpenSheet?: (meal: MealEntry) => void` — overrides internal sheet behavior
- `onDeleteFromSheet?: (meal: MealEntry) => void` — Delete button in internal MQRS
- `onFavorite?: (meal: MealEntry) => void` — Star toggle in internal MQRS
- `favoritesData?: FavoriteMeal[]` — for computing `isFavorited` per meal

### Prop Threading (Dashboard)

```
DashboardPage
  └─ TodaysMealsSection (onFavorite, favoritesData, onDeleteFromSheet)
    └─ MealListSection (same props)
      └─ MealLogRow (same props)
        └─ MealQuickLookSheet (onFavorite, onDeleteMeal, isFavorited)
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Two tabs instead of three | Build tab removed — not used by real users |
| Single `favorites` collection | Items and meals are the same thing; a single-item favorite is just a `FavoriteMeal` with one item |
| No item-level favoriting | Too granular. User feedback: "I just scan it again" |
| Modal (sheet) instead of one-tap logging | Allows weight adjustment, meal type selection before logging. Matches Dashboard pattern |
| No dedup on item saves | User manages their own favorites library (Gemini names are inconsistent) |
| In-memory sort instead of Firestore indexes | Avoids index deployment dependency. Favorites are small (<50 per user) |
| Fave button stays open, no redirect | User can continue interacting (adjust weights, view, delete) |
| Star in upper right | Consistent with meal detail page pattern |
| Star uses `isFavorited` prop + local `faveClicked` state | Instant visual feedback without waiting for query refetch |
| Log button closes sheet and redirects to dashboard | Consistent with scan flow; user sees their new meal |

---

## API Contracts

### `logFavorite(uid, favoriteId)`
Reads current `useCount`, increments by 1, sets `lastUsedAt = now`, updates the favorite document.

### `favoriteToMealEntry(favorite)` → MealEntry
Converts a `FavoriteMeal` to a `MealEntry` with `id: crypto.randomUUID()`, `geminiConfidence: 0`, `isManuallyAdjusted: true`, and recalculated saturated/unsaturated fat from items.

### `saveFavorite(uid, meal)` → favoriteId
Creates a `FavoriteMeal` from a `MealEntry`. Sets `useCount: 0`, `lastUsedAt: null`. Uses `meal.id` as `originalMealId`.

---

## File Manifest (created/modified)

**New:**
- `docs/build/phase-01-log-page-restructure.md`

**Deleted:**
- `lib/models/saved-item.ts` + `saved-item-doc.ts`
- `lib/repositories/saved-items.ts`
- `lib/queries/use-saved-items.ts` + `use-save-item.ts` + `use-delete-saved-item.ts`
- `components/saved-items/` (all 3 files)
- `components/meal/BuildMealTab.tsx`
- `components/favorites/FavoriteCard.tsx` + `FavoriteDetailSheet.tsx`
- `lib/copy/saved-items.ts`

**Modified:**
- `app/(app)/log/page.tsx` — Full restructure
- `app/(app)/log/[mealId]/page.tsx` — Removed item-level save
- `app/(app)/scan/page.tsx` — Removed item-level save
- `app/(app)/dashboard/page.tsx` — Added delete + star toggle
- `components/meal-log/MealQuickLookSheet.tsx` — Added star, action buttons, hideMealType, removed onSaveItem
- `components/meal-log/MealLogRow.tsx` — Added onOpenSheet, onDeleteFromSheet, onFavorite, favoritesData
- `components/meal-log/MealListSection.tsx` — Added onOpenSheet, onDeleteFromSheet, onFavorite, favoritesData
- `components/meal-log/MealDetailView.tsx` — Removed onSaveItem
- `components/meal-log/DailySummaryBar.tsx` — Added fiber
- `components/favorites/FavoritesGrid.tsx` — Simplified props (removed onDelete/onRename)
- `components/favorites/FavoriteMealRow.tsx` — Removed kelob menu
- `components/dashboard/TodaysMealsSection.tsx` — Added onDeleteFromSheet, onFavorite, favoritesData
- `lib/copy/common.ts` — Added action copy keys
- `lib/copy/keys.ts` — Removed savedItemsCopy
- `lib/queries/query-keys.ts` — Removed savedItems key
- `firestore.rules` — Removed savedItems rule
- `firestore.indexes.json` — Cleaned up
- `lib/services/user-data-deletion.ts` — Cleaned up
- `lib/models/favorite-meal.ts` — Added useCount, lastUsedAt
- `lib/models/favorite-meal-doc.ts` — Added useCount, lastUsedAt to doc + mappers
- `lib/repositories/favorites.ts` — Added logFavorite, in-memory sort
- `lib/queries/use-log-from-favorite.ts` — Increments useCount on log
- `lib/queries/use-save-favorite.ts` — Added useCount: 0 to optimistic update
- `lib/queries/use-favorites.ts` — No changes (staleTime: 5 min)
- `tests/unit/favorite-meal-doc.test.ts` — Updated fixtures with new fields
- `tests/unit/use-log-from-favorite.test.ts` — Updated fixtures with new fields

---

## Test Results

```
lint:  0 errors, 0 warnings
unit:  253 tests, 47 files — all passed
tsc:  0 errors in application code
```

## Next Steps / Known Gaps

- Rename for multi-item favorites is deferred (was in kelob menu, not re-added to sheet)
- History tab has no way to delete meals other than through View → meal detail page
- No undo toast for fave/unfave actions
- `common.action.save` copy key exists but is unused (was for the removed Fave button)
