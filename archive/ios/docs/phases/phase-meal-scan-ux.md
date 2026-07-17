# Phase: Meal Scan UX Simplification

**Date:** 2026-07-16
**Scope:** calsnap-web — meal type routing, add-more-servings UX
**Status:** Complete

---

## 1. Problem

The meal scanning flow had multiple confusing entry points and a critical bug: all "Add {mealType}" links (e.g., "Add Breakfast", "Add Snack") navigated to `/scan` without passing the intended meal type. The scan page always defaulted to `suggestedMealTypeForDate(new Date())` based on time of day, so:

- Clicking "Add Snack" at 2 PM → lunch was pre-selected
- Clicking "Add Dinner" at noon → lunch was pre-selected
- No way to add another serving to an existing meal type from the dashboard or log page

---

## 2. What Changed

### Files Modified (4)

| File | Change |
|------|--------|
| `lib/scanner/use-meal-scanner.ts` | Added optional `initialMealType` to `UseMealScannerOptions` |
| `app/(app)/scan/page.tsx` | Reads `mealType` from URL search params; wraps content in `<Suspense>` |
| `components/meal-log/MealListSection.tsx` | Links pass `?mealType={type}`; added "+" button per section header |
| `components/meal-log/MealLogRow.tsx` | Added "+" button linking to `/scan?mealType={mealType}` |

### No Files Added or Deleted

---

## 3. Key Decisions

1. **URL query param over context/router state** — Passing `?mealType=lunch` is explicit, debuggable, shareable, and survives page refreshes. No need for React context or client-side state routing.

2. **Optional `initialMealType` over conditional logic** — The hook accepts an optional param and falls back to time-based suggestion. Existing callers (edit page) are unaffected.

3. **`<Suspense>` wrapper for `useSearchParams`** — Next.js 16 requires a Suspense boundary around `useSearchParams` during prerendering. The scan page content was extracted into `ScanPageContent` and wrapped.

4. **"+" buttons always visible** — Placed on section headers and individual meal rows regardless of whether other meals exist. Provides consistent discoverability.

5. **Meal type selector stays on results screen only** — Per user preference, no UI changes to the capture phase. The URL param handles pre-selection; the results-screen selector handles overrides.

---

## 4. Architecture & Component Relationships

```
Dashboard / Log Page
  └─ MealListSection
       ├─ Section header: "Lunch" [+ button] → /scan?mealType=lunch
       ├─ Empty state: "Add Lunch" link → /scan?mealType=lunch
       └─ MealLogRow (per meal)
            ├─ Meal row (icon, time, calories) → /log/{mealId}
            └─ [+] button → /scan?mealType={mealType}

Scan Page (app/(app)/scan/page.tsx)
  └─ Suspense
       └─ ScanPageContent
            ├─ useSearchParams() → reads ?mealType={type}
            ├─ parseMealTypeParam() → validates against MealType enum
            └─ useMealScanner({ initialMealType })
                 └─ useState(() => initialMealType ?? suggestedMealTypeForDate(new Date()))
```

### Data Flow

1. User clicks "+" or "Add {mealType}" → navigates to `/scan?mealType=lunch`
2. `ScanPageContent` reads `searchParams.get('mealType')`
3. `parseMealTypeParam` validates against `MealType` enum values
4. Validated type passed as `initialMealType` to `useMealScanner`
5. Scanner initializes with that meal type (not time-based suggestion)
6. User can override on results screen via `MealTypeSelector`

---

## 5. API Contracts

### `useMealScanner` Options (updated)

```typescript
interface UseMealScannerOptions {
  userId: string;
  initialMealType?: MealType;  // NEW — optional
  onUnsavedWorkChange?: (hasUnsavedWork: boolean) => void;
}
```

### URL Contract

```
GET /scan?mealType={breakfast|lunch|dinner|snack}
```

- Valid values: `breakfast`, `lunch`, `dinner`, `snack`
- Invalid/missing values: fall back to time-based suggestion
- Validated at: `parseMealTypeParam()` in `scan/page.tsx`

### MealType Enum

```typescript
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MealType = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snack',
} as const;
```

---

## 6. Data Models (unchanged)

- `MealEntry` — client-side model with `Date` for timestamp
- `MealEntryDoc` — Firestore document model with `Timestamp`
- `MealType` — union type `'breakfast' | 'lunch' | 'dinner' | 'snack'`
- `MealsByType` — `Partial<Record<MealType, MealEntry[]>>`

No schema changes. No migration required.

---

## 7. Edge Cases & Invariants

| Case | Behavior |
|------|----------|
| Invalid `mealType` query param | Falls back to `suggestedMealTypeForDate(new Date())` |
| Missing `mealType` query param | Falls back to `suggestedMealTypeForDate(new Date())` |
| Bottom nav "Scan" tab (no param) | Uses time-based suggestion (unchanged) |
| Edit flow (`/scan/edit/{mealId}`) | Loads existing meal's type via `loadForEditing()` (unchanged) |
| Discard/reset | Resets to `suggestedMealTypeForDate(new Date())`, not `initialMealType` |
| Multiple servings | Each "+" creates a new separate `MealEntry` (not appended to existing) |

---

## 8. What Was NOT Changed

- Bottom nav "Scan" tab behavior (still time-based suggestion)
- `MealTypeSelector` on results screen (still only on results phase)
- `MealScannerCaptureView` (no meal type selector added)
- `MealAnalysisResultView` (no changes)
- Dashboard layout or section structure
- Firestore schema or data model
- API routes (`/api/analyze-meal`)

---

## 9. Verification

```bash
# Typecheck (pre-existing test errors only, no new errors)
npx tsc --noEmit

# Lint
npm run lint
```

Both pass clean. No new TypeScript errors introduced.

---

## 10. Context for Next Phase

- The `+` button creates a **new** `MealEntry` per click, not an append to an existing one. This matches the current data model (each meal is a separate Firestore document).
- If "add another serving" should later merge into an existing meal entry (e.g., increment a `servings` field), that requires a data model change and a new UI flow.
- The `Suspense` wrapper is minimal (no fallback UI). Consider adding a loading skeleton if the scan page ever needs to be statically prerendered.
- The copy key `mealLog.addMeal` uses `{{mealType}}` interpolation (e.g., "Add Lunch"). No new copy keys were added.
