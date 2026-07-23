# Firestore Optimization Plan

## Goal

Reduce Firestore read/write round-trips, eliminate perceived latency for the primary
user action (logging meals), remove unnecessary background refetches, and simplify
dead code — without changing the data model, security rules, or any user-facing
behavior.

## Guiding principles

1. **Every Firestore call is network latency (~100–300ms).** The only way to make the
   app feel faster is to eliminate calls or make them invisible to the user.
2. **Cache manipulation is cheaper than network invalidation.** Updating the React
   Query cache in-memory takes microseconds; unilaterally invalidating and
   refetching takes a full round-trip.
3. **Operations that don't depend on each other should run in parallel.** Sequential
   awaits are paid latency.
4. **Invalidation should be surgical.** Only refetch queries whose data actually
   changed.
5. **Remove indirection that adds no value.** Every extra function call, parameter, or
   abstraction is surface area for bugs.

---

## Architecture context

All data lives under `users/{userId}/` with four subcollections:

| Subcollection       | Doc ID               | Purpose                                                 |
| ------------------- | -------------------- | ------------------------------------------------------- |
| `profile/main`      | Fixed: `"main"`      | User profile, body stats, calorie/macro targets         |
| `meals/{mealId}`    | Random UUID          | Food diary entries with Gemini nutrition breakdown      |
| `weighIns/{wiId}`   | Random UUID          | Weight tracking + recalibrated TDEE                     |
| `favorites/{favId}` | Random UUID          | Saved meal templates for quick re-logging               |

All reads/writes happen client-side via the Firebase Web SDK (`firebase/firestore`).
The only server-side code (`app/api/`) uses Firebase Admin Auth for token
verification — no admin Firestore reads/writes.

TanStack Query wraps all data fetching with `staleTime: 30_000` and
`refetchOnWindowFocus: false` as global defaults. Mutations invalidate queries on
success, triggering background refetches.

---

## Phase 1 — Simplify & fix bugs (no user-visible change)

### 1.1 Fix `updateMeal`: read `createdAt` from existing doc

**File:** `lib/repositories/meals.ts`

**Problem:** `updateMeal` already calls `getDoc` to verify the doc exists, but
requires the caller to pass `existingCreatedAt` as a separate parameter. The
caller (`useUpdateMeal`) forces every edit page to carry a `Timestamp` through its
state just to pass it back.

**Change:**

Before (`meals.ts:118–129`):

```ts
export async function updateMeal(
  entry: MealEntry,
  existingCreatedAt: Timestamp,
  db: Firestore = getFirestoreDb(),
): Promise<void> {
  const docRef = doc(db, 'users', entry.userId, 'meals', entry.id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    throw new MealNotFoundError(entry.id);
  }
  await setDoc(docRef, mealEntryToUpdateDoc(entry, existingCreatedAt));
}
```

After:

```ts
export async function updateMeal(
  entry: MealEntry,
  db: Firestore = getFirestoreDb(),
): Promise<void> {
  const docRef = doc(db, 'users', entry.userId, 'meals', entry.id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    throw new MealNotFoundError(entry.id);
  }
  const data = snapshot.data() as MealEntryDoc;
  await setDoc(docRef, mealEntryToDoc(entry, data.createdAt));
}
```

**Cascading changes:**

- `lib/queries/use-update-meal.ts` — drop `existingCreatedAt` from
  `UpdateMealInput`. Remove the `Timestamp` import.

  Before:

  ```ts
  export interface UpdateMealInput {
    entry: MealEntry;
    existingCreatedAt: Timestamp;
  }
  ```

  After:

  ```ts
  export interface UpdateMealInput {
    entry: MealEntry;
  }
  ```

  Update the mutation function to not pass `existingCreatedAt`.

- `app/(app)/log/[mealId]/page.tsx` — remove `existingCreatedAt` from the
  mutation call at line 157. Remove the `createdAt` variable that sourced from
  `mealQuery.data?.createdAt` (line 59) — it's no longer needed for the update
  call (the `createdAt` is still needed for the `loadedMealIdRef` logic on
  line 79 but that uses `meal.id`, not `createdAt`).

- Integration tests — update any test that passes `createdAt` to `updateMeal`.

### 1.2 Delete `mealEntryToUpdateDoc` — inline into `updateMeal`

**File:** `lib/models/meal-entry-doc.ts`

**Problem:** `mealEntryToUpdateDoc` has exactly one call site (`updateMeal` in
`meals.ts`). Its body is a near-duplicate of `mealEntryToDoc` with one
difference (accepts `createdAt` as a parameter instead of generating it).
After Phase 1.1, `updateMeal` will pass `createdAt` to `mealEntryToDoc`
instead.

**Change:** Delete the `mealEntryToUpdateDoc` function. No other file imports
it (confirmed: zero external callers). No import updates needed elsewhere.

### 1.3 Remove dead wrapper functions

**Problem:** `docToMealEntry` in `meals.ts` and `docToWeighIn` in `weigh-ins.ts`
just delegate to model functions with no transformation, parameter reordering, or
error handling.

**File: `lib/repositories/meals.ts`**

Delete:

```ts
export function docToMealEntry(id: string, doc: MealEntryDoc): MealEntry {
  return mealDocToEntry(id, doc);
}
```

Import `mealDocToEntry` from `@/lib/models/meal-entry-doc` and call it directly at
the five internal call sites (lines 70, 91, 113, 142, 179) and the one external
call site in `lib/services/user-data-deletion.ts` (line 107).

**File: `lib/repositories/weigh-ins.ts`**

Delete:

```ts
export function docToWeighIn(id: string, doc: WeighInDoc): WeighIn {
  return weighInDocToEntry(id, doc);
}
```

Import `weighInDocToEntry` from `@/lib/models/weigh-in-doc` and call it
directly at the three internal call sites (lines 40, 63, 102).

### Phase 1 verification

- `pnpm lint`
- `pnpm exec vitest run tests/unit/`
- `pnpm test:integration` (requires Firebase emulators)
- Manual: navigate to meal detail page, edit a meal's items, save. Confirm no
  errors in console and meal data persists correctly.

---

## Phase 2 — Latency elimination (user-visible UX improvement)

### 2.1 Parallelize photo upload + Firestore write in `logMeal`

**File:** `lib/queries/use-log-meal.ts`

**Problem:** Photo upload to Firebase Storage runs to completion before the
Firestore `createMeal` write starts. These operations have no data dependency —
the meal doc can be created before, during, or after the photo upload.

**Change:**

Before:

```ts
export async function logMeal(uid, { entry, photoBlob }) {
  // ...photo upload runs first...
  let uploadedPhotoPath: string | undefined;
  if (photoBlob) {
    uploadedPhotoPath = await uploadMealPhoto(uid, entry.id, photoBlob);
  }
  const entryWithPhoto = { ...entry, photoStoragePath: uploadedPhotoPath ?? entry.photoStoragePath };
  try {
    await createMeal(entryWithPhoto);
  } catch (error) {
    if (uploadedPhotoPath) {
      try { await deleteMealPhoto(uploadedPhotoPath); } catch {}
    }
    throw error;
  }
  return entryWithPhoto;
}
```

After:

```ts
export async function logMeal(uid, { entry, photoBlob }) {
  if (!uid) throw notSignedInError();

  const photoPath = photoBlob
    ? `users/${uid}/meals/${entry.id}/photo.jpg`
    : undefined;

  const entryWithPhoto: MealEntry = {
    ...entry,
    photoStoragePath: photoPath ?? entry.photoStoragePath,
  };

  const photoPromise = photoBlob
    ? uploadMealPhoto(uid, entry.id, photoBlob)
    : undefined;

  try {
    await Promise.all([createMeal(entryWithPhoto), photoPromise]);
  } catch (error) {
    if (photoBlob) {
      await deleteMealPhoto(photoPath!).catch(() => {});
    }
    throw error;
  }

  return entryWithPhoto;
}
```

**Edge case:** If the Firestore write succeeds but the photo upload fails, the
meal doc has a `photoStoragePath` pointing to a nonexistent blob. The UI will
show a broken image placeholder — same UX as a slow or later-deleted photo.
The meal data remains intact, which is the important part. This is an acceptable
tradeoff for saving one round-trip (~200ms on typical connections).

### 2.2 Optimistic add on `useLogMeal` and `useLogFromFavorite`

**File:** `lib/queries/use-log-meal.ts`
**File:** `lib/queries/use-log-from-favorite.ts`

**Problem:** When the user taps "Save Meal", a spinner shows for ~300ms while the
Firestore write completes, then all related queries refetch. The user waits for
an operation whose outcome is already known (the app just constructed the meal
entry and knows what it looks like).

**Design decision (from stress-test):** No rollback on error. The optimistic
update makes the UI feel instant. On settle, a background refetch ensures
eventual consistency with the server. This eliminates the entire class of
concurrent-mutation bugs with zero added complexity.

**Change for `useLogMeal`:**

Before:

```ts
export function useLogMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LogMealInput) => logMeal(uid, input),
    onSuccess: (entry) => {
      if (!uid) return;
      const dayKey = localDayKey(entry.timestamp);
      invalidateMealQueries(queryClient, uid, dayKey);
    },
  });
}
```

After:

```ts
export function useLogMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LogMealInput) => logMeal(uid, input),
    onMutate: async (input) => {
      if (!uid) return { dayKey: '' };
      const dayKey = localDayKey(input.entry.timestamp);
      await queryClient.cancelQueries({
        queryKey: queryKeys.todaysMeals(uid, dayKey),
      });
      const previous = queryClient.getQueryData<MealEntry[]>(
        queryKeys.todaysMeals(uid, dayKey),
      );
      if (previous) {
        queryClient.setQueryData(queryKeys.todaysMeals(uid, dayKey), [
          ...previous,
          input.entry,
        ]);
      }
      return { dayKey };
    },
    onSettled: (_data, _error, _input, context) => {
      if (context?.dayKey && uid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.todaysMeals(uid, context.dayKey),
        });
      }
    },
  });
}
```

**Same pattern for `useLogFromFavorite`:** The `favoriteToMealEntry` function
already builds the full `MealEntry` synchronously. Apply the same `onMutate` /
`onSettled` pattern.

After Phase 3, `onSettled` will only invalidate `todaysMeals` — not analytics
or favorites — so the settle refetch is a single lightweight query.

### 2.3 Optimistic remove on `useDeleteMeal`

**File:** `lib/queries/use-delete-meal.ts`

**Change:** Same `onMutate` pattern as Phase 2.2 but removes the entry from the
`todaysMeals` array instead of adding it.

```ts
onMutate: async (mealId) => {
  // Fetch the meal to get its timestamp for dayKey. Since deleteMeal reads
  // the doc anyway, we compute the dayKey from the returned entry in
  // onSettled instead. Alternatively: compute dayKey from known data.
  // The current flow: mutationFn returns { entry, dayKey }.
  // For optimistic removal, we use the returned dayKey in onSettled.
},
```

**Note:** Unlike `logMeal`, the day key isn't known at mutation time for delete
(we only have the meal ID). The current `mutationFn` returns `{ entry, dayKey }`
computed after fetching the meal. For the optimistic update:

- In `onMutate`, we don't yet know which day to update.
- In `onSettled`, we invalidate `todaysMeals` using the `dayKey` from the
  returned data.

This means the delete won't have a true optimistic remove — the entry will
still show until the settle invalidate fires. However, the delete mutation is
rarely the source of perceived slowness (it's a "one and done" destructive
action, usually confirmed by a dialog). So we keep the current behavior for
delete: invalidate on success. No optimistic add/remove needed for delete.

**Verdict:** Skip optimistic remove for `useDeleteMeal`. The pattern adds
complexity (day key unknown at mutation time) for negligible UX gain on a
destructive action.

### 2.4 Cache-populate on `useSaveFavorite` and `useDeleteFavorite`

**File:** `lib/queries/use-save-favorite.ts`
**File:** `lib/queries/use-delete-favorite.ts`

**Problem:** When the user stars or unstars a meal, the app refetches the
entire favorites list from Firestore, causing a micro-spinner or toggle flicker.
The app already knows exactly what changed — no server confirmation needed.

**Change for `useSaveFavorite`:**

Before:

```ts
onSuccess: () => {
  if (!uid) return;
  void queryClient.invalidateQueries({ queryKey: queryKeys.favorites(uid) });
},
```

After — insert the saved favorite directly into the cache:

```ts
onSuccess: (favoriteId, meal) => {
  if (!uid) return;
  const favorite: FavoriteMeal = {
    id: favoriteId,
    userId: uid,
    originalMealId: meal.id,
    name: autoFavoriteName(meal.items),
    mealType: meal.mealType,
    totalCalories: meal.totalCalories,
    totalProteinG: meal.totalProteinG,
    totalCarbsG: meal.totalCarbsG,
    totalFatG: meal.totalFatG,
    totalFiberG: meal.totalFiberG,
    items: meal.items,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  queryClient.setQueryData<FavoriteMeal[]>(
    queryKeys.favorites(uid),
    (old) => (old ? [favorite, ...old] : [favorite]),
  );
},
```

**Change for `useDeleteFavorite`:**

Before:

```ts
onSuccess: () => {
  if (!uid) return;
  void queryClient.invalidateQueries({ queryKey: queryKeys.favorites(uid) });
},
```

After — remove the deleted favorite from the cache:

```ts
onSuccess: (_data, favoriteId) => {
  if (!uid) return;
  queryClient.setQueryData<FavoriteMeal[]>(
    queryKeys.favorites(uid),
    (old) => old?.filter((f) => f.id !== favoriteId) ?? [],
  );
},
```

### Phase 2 verification

- Manual: log a meal with a photo in dev mode. Verify the entry appears in the
  meal list.
- Manual: log a meal without a photo. Verify instant appearance (no spinner
  visible between save and entry appearing).
- Manual: star and unstar a meal. Verify star fill updates instantly with no
  flicker.
- `pnpm lint`

---

## Phase 3 — Reduce unnecessary reads (fewer background refetches)

### 3.1 Stop invalidating analytics and favorites on every meal write

**File:** `lib/queries/invalidate-meals.ts`

**Problem:** `invalidateMealQueries` calls `invalidateAnalyticsQueries` on every
meal write. This triggers a background refetch of analytics data (profile +
meals-in-range + weigh-ins = 3 reads) every time the user logs, edits, or
deletes a meal — even if they never visit the analytics tab. A user logging
5 meals/day triggers 15 unnecessary reads/day.

Similarly, it invalidates `favorites` on every meal write, which is never
needed (favorites don't change when meals change).

**Change:**

Before:

```ts
export function invalidateMealQueries(
  queryClient: QueryClient,
  uid: string,
  dayKey: string,
  mealId?: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.todaysMeals(uid, dayKey),
  });
  if (mealId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.meal(uid, mealId),
    });
  }
  void queryClient.invalidateQueries({
    queryKey: queryKeys.favorites(uid),
  });
  invalidateAnalyticsQueries(queryClient, uid);
}
```

After:

```ts
export function invalidateMealQueries(
  queryClient: QueryClient,
  uid: string,
  dayKey: string,
  mealId?: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.todaysMeals(uid, dayKey),
  });
  if (mealId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.meal(uid, mealId),
    });
  }
}
```

Remove the import of `invalidateAnalyticsQueries`. Favorites are covered by
Phase 2.4's direct cache manipulation.

**Design justification:** The analytics query has `staleTime: 0` (set in Phase
3.3 below), meaning it fetches fresh data on every tab visit. Eagerly
invalidating it on every meal write was wastefully fetching data the user may
never look at. Lazy fetch on visit is strictly fewer reads with same or better
freshness.

### 3.2 Stop invalidating analytics on weigh-in writes

**File:** `lib/queries/invalidate-weigh-ins.ts`

**Problem:** Same pattern as Phase 3.1 — `invalidateWeighInQueries` calls
`invalidateAnalyticsQueries` on every weigh-in.

**Change:**

Before:

```ts
export function invalidateWeighInQueries(
  queryClient: QueryClient,
  uid: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['profile', uid] });
  void queryClient.invalidateQueries({ queryKey: ['allWeighIns', uid] });
  void queryClient.invalidateQueries({ queryKey: ['weighIns', uid] });
  invalidateAnalyticsQueries(queryClient, uid);
}
```

After:

```ts
export function invalidateWeighInQueries(
  queryClient: QueryClient,
  uid: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['profile', uid] });
  void queryClient.invalidateQueries({ queryKey: ['allWeighIns', uid] });
  void queryClient.invalidateQueries({ queryKey: ['weighIns', uid] });
}
```

Remove the import of `invalidateAnalyticsQueries`.

### 3.3 Set `staleTime: 0` on `useAnalytics`

**File:** `lib/queries/use-analytics.ts`

**Problem:** The analytics query currently has `staleTime: 30_000` (line 57),
meaning the analytics tab can show data up to 30 seconds stale if the user
navigates back to it quickly. Since we removed the eager cascade invalidation
in Phase 3.1/3.2, we need to ensure analytics is always fresh when viewed.

**Change:** Set `staleTime: 0` to force a refetch on every analytics tab visit.

```ts
staleTime: 0,
```

This replaces the current `staleTime: 30_000` on line 57.

**Tradeoff:** The analytics tab always fetches on mount (was: fetch on mount
only if older than 30s). Cost: 1 extra read per analytics tab visit. Benefit:
always-fresh data with no eager background reads on meal/weigh-in writes.

### Phase 3 verification

- `pnpm lint`
- Manual: log a meal from the dashboard. Check browser network tab — confirm
  no analytics API calls or extra Firestore reads fire.
- Manual: log a weigh-in. Check network — confirm no analytics reads fire.
- Manual: navigate to analytics tab. Confirm data is fresh.

---

## Phase 4 — Cache tuning (fewer refetches during tab navigation)

### 4.1 Increase `staleTime` for slow-changing data

**Files:**
- `lib/queries/use-profile.ts`
- `lib/queries/use-favorites.ts`
- `lib/queries/use-all-weigh-ins.ts`

**Change:**

| Hook                 | Current staleTime     | New staleTime | Rationale                                                                 |
| -------------------- | --------------------- | -------------- | ------------------------------------------------------------------------- |
| `useProfile`         | 30s (global default)  | `5 * 60 * 1000` | Changes only on settings save or weigh-in (profile invalidated on weigh-in) |
| `useFavorites`       | 30s (global default)  | `5 * 60 * 1000` | Changes only on explicit save/delete (Phase 2.4 handles these directly)    |
| `useAllWeighIns`     | 30s (global default)  | `2 * 60 * 1000` | Changes only on new weigh-in (invalidated on weigh-in mut)            |

Each hook: add `staleTime: N` to the `useQuery` options object.

**Why this is safe:** Actual data changes (weigh-in, save favorite, update
profile) trigger immediate `invalidateQueries` calls that bypass staleTime
entirely. The increased staleTime only affects refetches triggered by
component remounts or tab navigation within the staleTime window.

**Net effect:** Navigating dashboard → settings → dashboard within a few
minutes serves profile and favorites from cache (0 reads) instead of
refetching (2 reads).

### Phase 4 verification

- `pnpm lint`
- Manual: load the app. Click between dashboard and settings tabs within 5
  minutes. Check network — confirm profile query not re-fetched.
- Manual: log a weigh-in. Confirm profile is re-fetched immediately despite
  the 5-minute staleTime.

---

## Phase 5 — Test updates

### 5.1 Update integration tests for changed signatures

**Affected test files:**

- `tests/integration/meal-crud-firestore.test.ts` — may call `updateMeal`
  with `existingCreatedAt` parameter
- `tests/integration/weigh-in-firestore.test.ts` — may import `docToWeighIn`
- `tests/integration/dashboard-firestore.test.ts` — may import
  `docToMealEntry`
- `tests/integration/profile-firestore.test.ts` — no expected changes (profile
  functions unchanged)

**Changes:**

1. `updateMeal` calls: remove the `existingCreatedAt` argument
2. `docToMealEntry` imports: replace with `mealDocToEntry` from
   `@/lib/models/meal-entry-doc`
3. `docToWeighIn` imports: replace with `weighInDocToEntry` from
   `@/lib/models/weigh-in-doc`

Run after all changes:

```bash
pnpm lint
pnpm exec vitest run tests/unit/
pnpm test:integration
```

---

## Breaking changes catalog

| Phase | Change                                        | Type              | Affected files                                                                            |
| ----- | --------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| 1.1   | `updateMeal` drops `existingCreatedAt` param  | Compile error     | `use-update-meal.ts`, `log/[mealId]/page.tsx`, integration tests                          |
| 1.2   | `mealEntryToUpdateDoc` removed                | Compile error     | None (only had one internal callsite; deleted)                                            |
| 1.3   | `docToMealEntry` removed                      | Compile error     | `meals.ts` (5 internal calls), `user-data-deletion.ts` (1 call), integration tests        |
| 1.3   | `docToWeighIn` removed                        | Compile error     | `weigh-ins.ts` (3 internal calls), integration tests                                      |
| 2.1   | Internal `logMeal` refactor                   | None              | No signature change                                                                       |
| 2.2   | `useLogMeal`, `useLogFromFavorite` internals  | None              | No signature change                                                                       |
| 2.4   | `useSaveFavorite`, `useDeleteFavorite` internal| None              | No signature change                                                                       |
| 3.1   | `invalidateMealQueries` internal logic        | None              | Callers unchanged                                                                         |
| 3.2   | `invalidateWeighInQueries` internal logic     | None              | Callers unchanged                                                                         |
| 3.3   | `useAnalytics` staleTime change               | None              | No signature change                                                                       |
| 4.1   | `staleTime` added to 3 hooks                  | None              | No signature change                                                                       |

All breaking changes are internal to the same codebase (same repo, same
package). Every break is a compile-time TypeScript error fixable by updating
imports and removing the dropped parameter. No data model changes, no schema
migration, no security rule changes, no API changes.

---

## Execution order

1. Phase 1 (simplify + fix bugs) — foundation for later phases
2. Phase 2 (latency elimination) — depends on Phase 1 clean signatures
3. Phase 3 (reduce unnecessary reads) — depends on Phase 2 cache patterns
   being in place
4. Phase 4 (cache tuning) — independent; can be merged with Phase 3
5. Phase 5 (test updates) — after all code changes; run full test suite

Each phase should be a separate commit. Verify with `pnpm lint` after each
commit.

---

## Summary of expected impact

| Metric                          | Before                               | After                                                |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| Perceived latency to log meal   | ~300ms spinner                       | Instant (entry appears in list immediately)           |
| Perceived latency to star meal  | Micro-spinner + list refetch          | Instant toggle                                       |
| Photo meal write time           | Photo upload + Doc write (serial)     | Max(upload, write) (parallel)                        |
| Reads per meal write            | todaysMeals + favorites + analytics  | todaysMeals only                                     |
| Reads per weigh-in write        | profile + weighIns + analytics       | profile + weighIns only                               |
| Reads per tab navigation        | 3-5 queries (every 30s)              | 0-2 queries (cached for minutes)                     |
| Analytics freshness when viewed | Up to 30s stale                      | Always fresh (fetches on visit)                      |
| Analytics freshness when idle   | Refetched on every meal/weigh-in     | Not refetched (lazy)                                 |
| Dead code                       | 3 wrapper functions + 1 dup function | Removed                                              |
