# FIRESTORE-OPTIMIZATION: Reduce Latency, Reads, and Complexity

**Status:** Implemented
**Source plan:** [docs/plans/firestore-optimization.md](../plans/firestore-optimization.md)
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Reduce Firestore read/write round-trips, eliminate perceived latency for the primary
user action (logging meals), remove unnecessary background refetches, and simplify
dead code — without changing the data model, security rules, or any user-facing
behavior.

---

## What shipped

| Phase | Area | Implementation |
|-------|------|----------------|
| 1 | `updateMeal` signature | Drops `existingCreatedAt` param; reads `createdAt` from the existing doc it already fetches for existence checking |
| 1 | Dead wrapper removal | Deleted `docToMealEntry`, `docToWeighIn`, `mealEntryToUpdateDoc`. `mealEntryToDoc` now accepts optional `createdAt` and handles both create+update |
| 1 | Cascading cleanup | `UpdateMealInput` simplified; `log/[mealId]/page.tsx` drops `createdAt` variable and guard |
| 2 | Parallel photo + write | `logMeal` runs `createMeal` and `uploadMealPhoto` concurrently via `Promise.allSettled`. Photo failure is non-fatal (meal data intact). Saves ~200ms per photo meal |
| 2 | Optimistic add | `useLogMeal` inserts meal into `todaysMeals` cache immediately via `onMutate`; `onSettled` does background invalidate for consistency. UI feels instant |
| 2 | Cache-populate favorites | `useSaveFavorite` inserts constructed `FavoriteMeal` directly into cache; `useDeleteFavorite` filters by ID. No refetch needed |
| 3 | Narrow invalidation | `invalidateMealQueries` no longer invalidates analytics or favorites. `invalidateWeighInQueries` no longer invalidates analytics. Saves 3+ reads per meal write, 3+ per weigh-in |
| 3 | Analytics freshness | `useAnalytics` set to `staleTime: 0` — always fetches on tab visit |
| 4 | Cache tuning | Profile `staleTime: 5min`, Favorites `staleTime: 5min`, AllWeighIns `staleTime: 2min`. Mutations invalidate immediately regardless of staleTime |
| — | Tests | `meal-log-crud.test.ts` updated (`mealEntryToUpdateDoc` → `mealEntryToDoc`) |

### Files changed (17 files, +118/−88 lines)

```
calsnap-web/app/(app)/log/[mealId]/page.tsx
calsnap-web/lib/models/meal-entry-doc.ts
calsnap-web/lib/queries/invalidate-meals.ts
calsnap-web/lib/queries/invalidate-weigh-ins.ts
calsnap-web/lib/queries/use-all-weigh-ins.ts
calsnap-web/lib/queries/use-analytics.ts
calsnap-web/lib/queries/use-delete-favorite.ts
calsnap-web/lib/queries/use-favorites.ts
calsnap-web/lib/queries/use-log-from-favorite.ts
calsnap-web/lib/queries/use-log-meal.ts
calsnap-web/lib/queries/use-profile.ts
calsnap-web/lib/queries/use-save-favorite.ts
calsnap-web/lib/queries/use-update-meal.ts
calsnap-web/lib/repositories/meals.ts
calsnap-web/lib/repositories/weigh-ins.ts
calsnap-web/lib/services/user-data-deletion.ts
calsnap-web/tests/unit/meal-log-crud.test.ts
```

---

## Key decisions

### 1. `Promise.allSettled` for parallel photo + write

`Promise.all` was the initial implementation but was rejected during review — if
`createMeal` succeeded and `uploadMealPhoto` failed, `Promise.all` threw and the
user saw "Save failed" despite the meal being persisted. `Promise.allSettled`
makes photo failure non-fatal: the meal exists, the photo shows a placeholder.
Meal creation failure is still fatal (throws `mealResult.reason`).

### 2. No optimistic update for `useLogFromFavorite`

`favoriteToMealEntry()` generates `crypto.randomUUID()` for the meal ID. An
optimistic add would require calling it twice (once in `onMutate`, once in
`mutationFn`), producing different IDs — a visual glitch where the wrong ID
appears then gets replaced on refetch. Reverted to `onSuccess`-based
invalidation, consistent with the plan's precedent for `useDeleteMeal` (skip
optimistic manipulation when the ID isn't known at mutation time).

### 3. No rollback on optimistic error

The stress-test concluded that an `onError` rollback adds complexity for a
vanishingly rare edge case (Firestore writes don't fail under normal conditions).
The design: optimistic insert in `onMutate`, background consistency refetch in
`onSettled`. If the write fails, the entry briefly appears then vanishes on
refetch — acceptable tradeoff.

### 4. Analytics cascade removal with `staleTime: 0`

Previously, every meal and weigh-in write triggered a background refetch of
analytics data (profile + meals-in-range + weigh-ins = 3 reads), even if the user
never visited the analytics tab. Removed cascade, set `staleTime: 0` on
`useAnalytics` so it always fetches fresh data on tab visit. Same freshness
guarantee, fewer background reads (lazy instead of eager).

### 5. `invalidateAnalyticsQueries` retained for plateau + profile paths

The function is still called from `use-plateau-alert.ts` and
`invalidate-profile-queries.ts`. Plateau changes and profile settings changes
correctly trigger analytics invalidation. Only the meal/weigh-in write paths were
removed.

### 6. `docToMealEntry` / `docToWeighIn` removal was inlining, not abstraction collapse

These wrappers had zero transformation logic — they were pure delegates. Removing
them and calling `mealDocToEntry` / `weighInDocToEntry` directly reduces call-stack
depth without changing behavior. The `UserDataDeletion` service was updated to
import from the model layer directly instead of depending on the repository.

---

## Architecture & data flow

### Before

```
log meal
  ├─ upload photo (Storage)          [~200ms]
  ├─ createMeal (Firestore)          [~200ms]
  ├─ invalidate todaysMeals          → refetch todaysMeals
  ├─ invalidate favorites            → refetch favorites     (unnecessary)
  └─ invalidate analytics            → refetch 3 queries     (unnecessary)

Total: ~700ms perceived, 5 Firestore reads triggered
```

### After

```
log meal
  ├─ [createMeal, uploadPhoto]       [~200ms parallel]
  └─ optimistic insert into cache    [instant, user sees meal]

  background:
    └─ invalidate todaysMeals        → refetch 1 query

Total: instant perceived, 1 Firestore read triggered
```

### Before

```
star meal
  └─ invalidate favorites            → refetch full list from Firestore
```

### After

```
star meal
  └─ setQueryData(favorites, [newFavorite, ...old])  [instant, 0 reads]
```

---

## Performance impact

| Metric | Before | After |
|--------|--------|-------|
| Perceived latency to log meal | ~300ms spinner | Instant (optimistic insert) |
| Perceived latency to star meal | Micro-spinner + list refetch | Instant toggle |
| Photo meal write time | Photo upload + Doc write (serial) | max(upload, write) (parallel) |
| Reads per meal write | todaysMeals + favorites + analytics (3 query refetches) | todaysMeals only (1 query refetch) |
| Reads per weigh-in write | profile + weighIns + analytics (3 query refetches) | profile + weighIns (2 query refetches) |
| Reads per tab navigation | 3-5 queries (refetch every 30s) | 0-2 queries (cached for minutes) |
| Analytics freshness when viewed | Up to 30s stale | Always fresh (staleTime: 0) |
| Analytics freshness when idle | Refetched on every meal/weigh-in | Not refetched (lazy) |
| Dead code | 3 wrapper functions + 1 dup function | Removed |

---

## Breaking changes (compile-time only)

| Change | Affected files |
|--------|---------------|
| `updateMeal` drops `existingCreatedAt` param | `use-update-meal.ts`, `log/[mealId]/page.tsx`, integration tests |
| `mealEntryToUpdateDoc` removed | None (only had one internal callsite; inlined) |
| `docToMealEntry` removed | `meals.ts` (5 calls), `user-data-deletion.ts` (1 call) |
| `docToWeighIn` removed | `weigh-ins.ts` (3 calls) |

All breaks are internal TypeScript compile errors in the same repo. No data model
changes, no schema migration, no security rule changes, no API contract changes.

---

## Data model (unchanged)

```
/users/{userId}/
  /profile/main           — ProfileDoc (20 fields)
  /meals/{mealId}         — MealEntryDoc (17 + items[])
  /weighIns/{weighInId}   — WeighInDoc (8 fields)
  /favorites/{favoriteId} — FavoriteMealDoc (11 + items[])
```

---

## Next phase context

The app now has optimistic UI for the core meal-log flow and surgical
invalidation. The next optimization phase should consider:

1. **Persistent cache** (`@tanstack/query-persist-client-core` + IndexedDB
   persister) for instant page loads on PWA reopen
2. **Targeted `updateDoc`** for profile fields (plateau calorie target updates,
   weigh-in-triggered profile recalculation) to eliminate remaining
   read-modify-write patterns on cold paths
3. **`onSnapshot` listener** on the profile doc for cross-tab consistency (1
   listener, negligible cost)
