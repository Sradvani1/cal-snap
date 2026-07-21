# FAVORITE-DETAIL-SHEET: Confirmation Bottom Sheet for Favorites

**Status:** Implemented
**Depends on:** `ad2a1ae` (historical day browser + favorites collection)
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Replace the one-tap "log from favorite" action with a bottom-sheet confirmation that shows meal details before the user commits. This prevents accidental logging and gives the user a chance to review portion sizes and macros before the meal is added to today's log.

**Out of scope:** multi-select, batch logging, editing items before logging, full-page navigation for favorite details.

---

## What shipped

| Area | Implementation |
|------|----------------|
| Sheet component | `components/favorites/FavoriteDetailSheet.tsx` — bottom sheet (mobile) / centered dialog (desktop) via `AppDialog` with `sheet` mode |
| Sheet content | Meal type icon + label, favorite name (dialog title), item rows (name, calories, weight), macro pill row (Protein / Carbs / Fat), "Log for today" primary button, Cancel secondary button |
| Item rows | Compact `bg-cs-muted/10` cards — name + kcal on left, weight on right |
| Macro pills | Three `MacroPill` sub-components in a `flex gap-3` row — label on top, value below |
| Error display | `role="alert"` paragraph shown above buttons when `errorMessage` prop is set |
| Page integration | `app/(app)/log/page.tsx` — sheet state (`sheetFav` / `sheetOpen`), `handleOpenSheet` sets selected favorite, `handleLogFromSheet` runs mutation + clears sheet + shows confirmation |
| Grid prop rename | `components/favorites/FavoritesGrid.tsx` — `onUse` → `onOpenDetail` (semantic: opens sheet instead of logging directly) |
| Copy keys | `mealLog.favorites.logAction: 'Log for today'`, `mealLog.favorites.logging: 'Logging\u2026'` |

---

## Key decisions

1. **Sheet pattern, not a new page.** Tapping a favorite card opens a bottom-sheet overlay rather than navigating to a dedicated detail route. This keeps the user in the Favorites tab and minimizes context switch.

2. **`AppDialog` with `sheet={true}` (default).** Reuses the existing dialog/sheet component — bottom-sheet on mobile (rounded top corners, drag handle), centered dialog with `max-h-[90vh]` on desktop (`sm:` breakpoint). Consistent with `WeighInSheet`, `PlateauAlertSheet`, and `AnalyticsCustomRangeSheet`.

3. **Simple item rows, not `FoodItemRowView`.** The existing `FoodItemRowView` is a border-rounded card (`rounded-xl`, `border`, `p-3`) that would produce a nested-card visual inside the sheet. Instead, items render as compact `bg-cs-muted/10` rows with name/kcal left and weight right — visually subordinate to the sheet surface.

4. **Error inside the sheet, not below the grid.** The plan initially suggested showing errors below the grid, but the mutation's error state (`logFromFavoriteMutation.isError`) would never be reachable from the Favorites tab because the error message block lives inside the `activeTab === 'log'` JSX branch. Instead, `errorMessage` is passed as a prop and rendered as a `role="alert"` paragraph above the action buttons. The sheet stays open on failure so the user can retry.

5. **`sheetFav` is the source of truth for the log action.** `handleLogFromSheet` reads `sheetFav` from its `useCallback` closure rather than from a ref. This means the callback is recreated on every `sheetFav` change — correct for React 16, and the button always calls the latest closure. The guard `if (!sheetFav || !user) return;` prevents double-submit if the sheet closes before the async mutation resolves.

---

## Architecture & component relationships

```
log/page.tsx
  └─ favorites tab renders:
       FavoritesGrid
         └─ FavoriteCard (onUse → onOpenDetail(fav))
              └─ user taps card
                   → handleOpenSheet(fav)
                   → setSheetFav(fav), setSheetOpen(true)

       FavoriteDetailSheet (conditionally rendered, always mounted)
         └─ AppDialog (sheet mode)
              ├─ Header: icon + meal type label + name (DialogTitle)
              ├─ Items list (FoodItem rows, read-only)
              ├─ Macro pills (Protein / Carbs / Fat)
              ├─ Error alert (conditional, role="alert")
              ├─ PrimaryButton "Log for today" (disabled while isLogging)
              └─ SecondaryButton "Cancel" → onOpenChange(false)

       on "Log for today":
         → handleLogFromSheet()
         → logFromFavoriteMutation.mutateAsync(sheetFav)
         → on success: close sheet, show confirmText for 3s
         → on error:   show errorMessage inside sheet, user can retry
```

**State ownership:**
- `sheetOpen`, `sheetFav` — `log/page.tsx` (page-level state)
- `isLogging` — derived from `logFromFavoriteMutation.isPending`
- `errorMessage` — derived from `logFromFavoriteMutation.isError`

---

## API contract

No API changes. The existing `useLogFromFavorite` mutation (`lib/queries/use-log-from-favorite.ts`) is called from the page, not the sheet component. The sheet receives `onLog: () => void` as a prop — it never touches mutations or Firestore directly.

---

## Data model

No schema changes. `FavoriteMeal` model (`lib/models/favorite-meal.ts`) is consumed read-only by the sheet. Items render display values (`name`, `calories`, `estimatedWeightG`). Macros render from top-level fields (`totalProteinG`, `totalCarbsG`, `totalFatG`).

---

## Test status

| Suite | Result |
|-------|--------|
| Unit (non-integration) | 48 files / 255 tests — **pass** |
| Lint | **0 errors** |

No new tests added — the feature adds UI components and wiring only; no business logic, no API routes, no data layer changes.

---

## Edge cases and behavior

| Scenario | Behavior |
|----------|----------|
| Tap card while sheet is open | Closes current sheet, opens new one with tapped favorite (state replacement via `handleOpenSheet`) |
| Tap outside/drag down while mutation in flight | Sheet closes, mutation continues silently — no confirm text shown on resolution (acceptable edge case) |
| Mutation fails | Sheet stays open, error text appears in `role="alert"` above buttons, "Log for today" re-enabled for retry |
| Cancel button during logging | Button is disabled (`isLogging === true`), cancel still works via `onOpenChange(false)` — same dismiss-in-flight behavior |
| Multiple rapid taps on "Log for today" | First tap starts mutation, subsequent taps are no-ops (button disabled via `isLogging`) |
| Sheet with `null` favorite (initial render) | `if (!favorite) return null;` — renders nothing until a favorite is selected |

---

## Next-phase context / notes

- **Error display in favorites tab for delete mutations:** `deleteFavoriteMutation.isError` render (line 229–231 of `page.tsx`) is inside the `activeTab === 'log'` branch, so it's never visible when on the Favorites tab. Pre-existing, not introduced here. If this becomes an issue, the error messages should be moved outside the tab ternary or duplicated.
- **No loading skeleton for sheet:** The sheet opens instantly with the `FavoriteMeal` object already in memory (no data fetch). No loading state needed — the button shows "Logging…" while the mutation runs.
- **`AppDialog.sheet` defaults are correct:** No `sheet` prop is passed, so `sheet={true}` is used. If a future use needs a non-sheet `AppDialog` for this feature, pass `sheet={false}` explicitly.

---

## Files changed

**Created:**
- `components/favorites/FavoriteDetailSheet.tsx` (125 lines)

**Modified:**
- `app/(app)/log/page.tsx` — import, sheet state, handlers, sheet mount, error prop
- `components/favorites/FavoritesGrid.tsx` — prop rename `onUse` → `onOpenDetail`
- `lib/copy/meal-log.ts` — two new copy keys
