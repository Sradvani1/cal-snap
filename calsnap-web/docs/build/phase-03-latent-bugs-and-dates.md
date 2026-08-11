# Phase 3 — Latent Bugs & Date Edge Cases (D1, D2, D3)

Master plan: [docs/plans/V1-REVIEW.md](../../docs/plans/V1-REVIEW.md) — §"Phase 3 — Latent
bugs & date risks (D1, D2, D3)". Build index: [docs/build/README.md](../../docs/build/README.md).

**Status: implemented — lint, unit tests, and production webpack build passed.**

## Locked scope decisions (from review + stress test)

| Item | Decision |
|------|----------|
| Extra D1 progress-page weigh-in load error | **Include** — it remains unresolved after Phase 2 |
| `deleteAllUserData` robustness | **Complete in Phase 2** — remove from this phase |
| D3 `useLogMeal` optimistic-cache race | **Fix** — functional cache updater inline in `onMutate` (compose-safe); no helper extraction or dedicated test |
| Feb 29 birth-date picker drift (E3, cosmetic) | **Skip** — remains a tracked residual per the review's "cosmetic; optionally fixed" |
| Profile-error routing and retry UI (A1) | **Complete in Phase 2** — reuse `resolveProfileRoute`, `ProfileLoadError`, and their existing tests |
| Analytics weigh-in error surfacing (D2) | **Remove the fetch** — drop `useAnalyticsWeighIns` from the analytics page; make the snapshot's `weighInsInRange` optional; no banner, no new copy key |
| Favorite double-tap guard (B2) | **Reuse mutation state** — `saveFavoriteMutation.isPending \|\| deleteFavoriteMutation.isPending` (the `log/[mealId]/page.tsx:192` pattern), no new `useState` |
| Quick-look partial save failure | **Separate core save from favorite usage tracking** — only a failed `createMeal` keeps the sheet open; a post-save `logFavorite` failure is best-effort and must not invite a retry that could duplicate the meal |
| Quick-look error lifetime | **Clear on open and close** — a sheet error belongs only to its current sheet session |
| D2 dead-code cleanup | **Phase 4 handoff** — list dead analytics files, invalidations, and tests explicitly; do not broaden Phase 3 |
| DST test portability | **Always-run calendar tests plus conditional transition tests** — verify ordinary behavior everywhere and concrete 23/25-hour cases where available |
| Phase 2 sign-off | **Block Phase 3 implementation** until the five-profile production preflight is complete |

The four `YYYY-MM-DD` formatters are consolidated in **this** phase (moved from the original
Phase 4 C4.2) because the consolidation is coupled to the DST-safe `daysBetween` fix.

---

## Work items

### A1 — Auth: profile-error routing (complete in Phase 2)

- Phase 2 implemented this work in `lib/auth/resolve-profile-route.ts`,
  `components/auth/ProfileLoadError.tsx`, `lib/auth/auth-context.tsx`, and the app,
  onboarding, login, and signup gates.
- Existing coverage in `tests/unit/resolve-profile-route.test.ts` verifies loading, missing
  profiles, profile errors, onboarding, and dashboard routing.
- Do not add a second gate helper, retry component, or profile-error copy key. Phase 3 only
  relies on this completed behavior; it does not modify these files for A1.

### A2 — Session: reset `redirectPromise` on failure

- `lib/auth/auth-context.tsx:67-72`: clear the module-level promise on rejection so the next
  mount re-reads the OAuth redirect result (one failed attempt must not poison the session):
  ```ts
  redirectPromise ??= getRedirectResult(auth).catch((error) => {
    redirectPromise = undefined;
    throw error;
  });
  return redirectPromise;
  ```
- Test: `tests/unit/consume-redirect.test.ts` mocks `getRedirectResult` to reject once then
  resolve and verifies the second call re-invokes Firebase.

### B — Log-page sheet: error surfacing + double-tap guard

- `components/meal-log/MealQuickLookSheet.tsx`:
  - Add optional `error?: string | null` and `isFavoritePending?: boolean` props. Existing
    call sites (including `MealLogRow`) are unaffected — the props are optional.
  - `onLog` type becomes `(items: FoodItem[], mealType: MealType) => Promise<void> | void`.
    `handleLog` (162-165) awaits it in a try/catch and closes the sheet **only on success** so
    a failed save keeps the sheet open with the inline error visible.
  - `handleFavorite` (167-170) no-ops when `isFavoritePending` and toggles the star only after
    the callback succeeds, leaving the visual state unchanged after a failed mutation.
  - Render `error` as `InlineErrorMessage` (import from
    `@/components/design/InlineErrorMessage`) above the action buttons.
- `app/(app)/log/page.tsx`:
  - `handleSheetLog` (152-173): treat `createMeal` as the authoritative save. If it fails,
    catch it, set `sheetError(copy('mealLog.sheet.error.logFailed'))`, and rethrow so the sheet
    stays open. After `createMeal` succeeds, treat `logFavorite` and query invalidation as
    best-effort follow-up work: warn or swallow their failure and continue to the dashboard;
    never ask the user to retry a meal that was already created.
  - `handleSheetFavorite` (175-190): wrap in try/catch/finally with
    `setSheetError(copy('mealLog.favorites.errorSave'))` on failure and return `false`; return
    `true` after success. Do not rethrow — the sheet uses the result to keep the star unchanged
    on failure without an unhandled rejection.
  - Pass `error={sheetError}` and `isFavoritePending` to the sheet. Clear `sheetError` when a
    sheet opens and closes, as well as at the start of each new attempt. `isFavoritePending` is
    **not** a new state variable — pass `saveFavoriteMutation.isPending ||
    deleteFavoriteMutation.isPending` directly (the `log/[mealId]/page.tsx:192` pattern). The
    sheet's `handleFavorite` no-ops while it is true, preventing the double-tap double-create.

### C — Weigh-in form Invalid Date guard

- `lib/progress/use-weigh-in-form.ts:14-24`: drop local `toDateInputValue`/`dateFromInputValue`;
  import `toLocalDateInputValue`, `dateFromLocalDateInput`, `isValidLocalDateInputValue` from
  `@/lib/utilities/date-input`. `selectedDateValue` becomes `Date | null` (null when the input
  is incomplete or not a real calendar date), add `isDateValid`, and fold `isDateValid` into
  `canSave`.
  (The form now uses the canonical noon parse; `saveWeighIn` normalizes to `startOfLocalDay`
  in `validateWeighInInput`, so stored data is unchanged.)
- `components/progress/WeighInSheet.tsx`: render an inline `<p role="alert">`
  (`progress.validation.dateRequired`) under the date input when `!form.isDateValid`. In
  `handleSave`, `selectedDateValue` is now `Date | null`, so add an explicit guard after the
  `!form.canSave` check — `if (!form.selectedDateValue) return;` — to satisfy TypeScript
  narrowing before it is passed as `date` to `mutateAsync`.
- `lib/services/weigh-in-service.ts:82-94` (`validateWeighInInput`), defense in depth:
  ```ts
  if (Number.isNaN(date.getTime())) {
    throw new WeighInValidationError(copy('progress.validation.dateRequired'));
  }
  ```
  before `startOfLocalDay`.
- Test: `weigh-in-service.test.ts` — `saveWeighIn` with `new Date(NaN)` rejects with
  `WeighInValidationError`.

### D1 — Progress page: weigh-in load failure surfaced

- `lib/queries/use-progress.ts`: add `weighInsLoadFailed = !weighInsQuery.isLoading && weighInsQuery.isError`
  to the returned object.
- `components/progress/WeightProgressView.tsx:64`: extend the error branch to
  `if (progress.profileLoadFailed || progress.weighInsLoadFailed || !progress.profile || !progress.stats)`
  → `InlineErrorMessage(copy('progress.error.loadFailed'))` (no zero-based stats). Keep the
  existing `partialLoad` banner for the profile-fragment case.

### D2 — Analytics: remove the silent weigh-ins fetch

- `app/(app)/analytics/page.tsx`: drop `useAnalyticsWeighIns` (import, hook call, and the
  `weighInsInRange: weighInsQuery.data ?? []` argument at line 74). The silent `?? []` is gone
  because the dead fetch is gone — the weigh-in query feeds nothing user-visible (the insight
  payload's `weightChangeKg` is not displayed anywhere).
- `lib/analytics/build-analytics-snapshot.ts`: make `BuildAnalyticsSnapshotInput.weighInsInRange`
  optional and default it to `[]` inside `buildAnalyticsSnapshot` before calling
  `buildInsightPayload`, so the analytics page no longer passes it. No behavior change to the
  snapshot output — `buildInsightPayload` still computes `weightChangeKg` internally.
- Phase 2 already centralized the analytics query keys and verified weigh-in invalidation. Keep
  that implementation unchanged until the Phase 4 cleanup below.
- **Dead-code aftermath for Phase 4 C7/C2:** dropping the fetch makes `use-analytics-weigh-ins.ts`
  and its only consumer `fetchWeighInsInWindow` (`lib/repositories/weigh-ins.ts`) dead, and the
  `['analyticsWeighIns', …]` invalidations in `invalidateAnalyticsQueries` /
  `invalidateWeighInQueries` become no-ops. Phase 4 must delete `use-analytics-weigh-ins.ts`,
  `fetchWeighInsInWindow`, the `analyticsWeighIns` invalidation key, plus the now-unused
  `weighInsInRange` input field and `buildInsightPayload`. Update the Phase 4 C7/C2 checklist and
  affected query-key/invalidation tests to name these files explicitly before beginning Phase 4.

> **Phase 4 handoff completed:** The historical `weighInsInRange`, `buildInsightPayload`, analytics
> weigh-in hook, repository fetch, query key, and invalidation references described above were
> removed in Phase 4 C7. The remaining sections below are historical Phase 3 implementation notes.

### E1/E2 — Date consolidation + DST-safe day counting

- `lib/utilities/date-input.ts` — add:
  ```ts
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  /** Local calendar day key `YYYY-MM-DD`. Delegates to the existing formatter. */
  export function toLocalDayKey(date: Date): string {
    return toLocalDateInputValue(date);
  }

  function utcDayNumber(date: Date): number {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
  }

  /** Local calendar days between two dates — DST-safe. */
  export function calendarDaysBetween(start: Date, end: Date): number {
    return utcDayNumber(end) - utcDayNumber(start);
  }

  /** True when a complete input value maps back to the same local calendar date. */
  export function isValidLocalDateInputValue(value: string): boolean {
    return isCompleteDateInputValue(value) &&
      toLocalDateInputValue(dateFromLocalDateInput(value)) === value;
  }
  ```
  `toLocalDayKey` delegates to the existing `toLocalDateInputValue` (byte-identical output — one
  formatter, not two), and is the canonical replacement for `localDayKey`/`dayKeyFromDate`. `calendarDaysBetween`
  counts local calendar days regardless of DST by using UTC day
  numbering of the local calendar fields (O(1), immune to 23/25-hour days).
- `lib/dashboard/date-window.ts`: re-export aliases —
  `export { toLocalDayKey as localDayKey, calendarDaysBetween as daysBetween } from '@/lib/utilities/date-input';`
  All 31 existing importers of `localDayKey`/`daysBetween` are unchanged; no circular import
  (date-input imports nothing from date-window).
- `lib/queries/use-todays-meals.ts:21-26`: drop local `dayKeyFromDate`, use `toLocalDayKey`.
- `lib/nutrition/calculator.ts:167-169` (`weeklyLossRateKg`): replace the inline
  `Math.floor((last.date - first.date) / 86400000)` with `calendarDaysBetween(first.date, last.date)`;
  keep `if (days <= 0) return null;`.
- Downstream users of `daysBetween` (`weigh-in-reminder.ts:26-27`, `progress-stats.ts:61`,
  `analytics-types.ts:113` `spanDays = daysBetween(…) + 1`) get the DST fix for free and stay correct.
- E3 (Feb 29 picker drift): **skipped** — tracked residual.

### F — `useLogMeal` optimistic-cache race (D3)

- `lib/queries/use-log-meal.ts:67-87`: replace the read-then-`setQueryData` in `onMutate` with a
  compose-safe functional update — no helper extraction, no new test. The functional updater's
  atomic composition is react-query's own API contract (two concurrent `onMutate` appends compose
  instead of last-write-wins dropping an entry):
  ```ts
  onMutate: async (input) => {
    if (!uid) return { dayKey: '' };
    const dayKey = localDayKey(input.entry.timestamp);
    await queryClient.cancelQueries({ queryKey: queryKeys.todaysMeals(uid, dayKey) });
    queryClient.setQueryData<MealEntry[]>(
      queryKeys.todaysMeals(uid, dayKey),
      (old) => [...(old ?? []), input.entry],
    );
    return { dayKey };
  },
  ```
  `onSettled` keeps invalidation as the server-truth reconciliation. The scan page already
  disables Log while a mutation is pending. The existing `logMeal()` function test covers the
  server-data path. `onMutate` stays untested — the functional updater's compose-safe behavior
  is react-query's own API contract; a focused cache-composition assertion with a stubbed
  `QueryClient` can be added later if the race is ever observed in production.

---

## Copy keys added (all live; no Phase-4 C8 conflict)

| Key | Value |
|-----|-------|
| `progress.validation.dateRequired` | "Enter a valid date." |
| `mealLog.sheet.error.logFailed` | "Could not save this meal. Try again." |
| `mealLog.favorites.errorSave` | "Failed to save favorite. Try again." |

Added in the per-feature modules: `lib/copy/progress.ts`, `lib/copy/meal-log.ts` (keys are
compile-time checked). Profile-load copy already exists in `lib/copy/dashboard.ts` and is reused
by the Phase 2 `ProfileLoadError` component.

---

## Test additions / updates

- **New:**
  - `tests/unit/consume-redirect.test.ts` — rejected redirect reads do not poison later reads;
    `tests/unit/resolve-profile-route.test.ts` covers the completed Phase 2 A1 behavior.
  - `tests/unit/date-input.test.ts` — `toLocalDayKey` round-trip; ordinary calendar-day
    differences; invalid calendar dates are rejected; `calendarDaysBetween` across DST
    boundaries where available.
  - `tests/unit/date-window.test.ts` — `daysBetween` across a 23-hour spring-forward and a
    25-hour fall-back day count full calendar days; `localDayKey` round-trip (currently untested).
    Use `it.skipIf` only for concrete spring-forward/fall-back transition cases so CI stays green
    in non-DST timezones; keep ordinary calendar-day assertions unconditional.
  - `tests/unit/nutrition-calculator.test.ts` — `weeklyLossRateKg` spanning a DST week uses
    calendar-day count.
  - `tests/unit/weigh-in-service.test.ts` — invalid date rejects with `WeighInValidationError`.
- **Updated:** import sites for the consolidated date helpers
  (`use-todays-meals.ts`, `use-weigh-in-form.ts`).

## Verification

```bash
cd calsnap-web
pnpm lint && pnpm test
```

- Manual spot-checks in `pnpm dev`:
  - Cleared weigh-in date shows the inline validation message; save is disabled.
  - A blocked profile read shows the retry view, not `/onboarding`.
  - Quick-look sheet log failure shows the inline error and keeps the sheet open.
  - Double-tap the star does not double-create a favorite.
  - Progress screen shows the error state (not zeros) when weigh-ins fail to load.
  - Analytics page loads correctly with the weigh-in fetch removed (no regressions in charts).
  - Phase 2's deletion behavior is already covered by its unit/integration verification; do not
    duplicate that verification in Phase 3.

## Out of scope (unchanged from master plan)

- Data-model changes, Firestore/Storage security-rule changes, changes to live client-facing API
  contracts, new runtime dependencies.
- P2-A5 zero-weight item affordance (locked-deferred to product).

## Residual risks updated for this phase

- **Feb 29 bounds shift** (`dateOfBirthInputBounds`): deferred, cosmetic — `setFullYear`
  normalizes Feb 29 → Mar 1 on the input min/max only.
- **Non-standard DST transitions** (30/45-min zones): the UTC-day-number approach is immune by
  construction; noted as residual-safety.
- **Phase 2 release gate**: automated verification passed, but the five-profile production
  preflight must be completed before the Phase 2 sign-off and before Phase 3 implementation.
- **Analytics weigh-in fetch removed**: the insight payload's `weightChangeKg` is not displayed
  anywhere; Phase 4 C7/C2 deletes `use-analytics-weigh-ins.ts`, `fetchWeighInsInWindow`, the
  `analyticsWeighIns` invalidation key, the now-unused `weighInsInRange` input, and
  `buildInsightPayload`.
- **A5 zero-weight item**: unchanged — recovery path is delete/re-analyze (product decision pending).
