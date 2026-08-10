# Phase 3 — Latent Bugs & Date Edge Cases

**Status:** Implemented — lint, 53 unit test files / 291 tests, and the production webpack build
passed.

**App:** `calsnap-web` (Next.js 16 App Router PWA)

**Source plan:** [phase-03-latent-bugs-and-dates.md](../../calsnap-web/docs/build/phase-03-latent-bugs-and-dates.md)

**Parent review:** [V1-REVIEW.md](../plans/V1-REVIEW.md)

**Implementation:** This build-record change set contains the Phase 3 implementation and its
regression tests.

---

## Objective

Close small but consequential correctness gaps around failed saves, invalid dates, stale cache
updates, DST boundaries, and unused analytics reads. Phase 2's profile routing and account
deletion work is reused rather than duplicated.

No Firestore schema, Storage rule, or live client-facing API changes were introduced.

---

## What Shipped

| Area | Implementation |
|------|----------------|
| Google redirect recovery | `consumeRedirect` clears its module-level cached promise when `getRedirectResult` rejects, allowing a later OAuth redirect read to run again. |
| Meal sheet save errors | The quick-look sheet awaits async log callbacks, stays open after a core meal-write failure, and renders an inline error. |
| Partial favorite logging | Meal creation is authoritative. A failed favorite usage-count update is warned and does not invite a retry that could duplicate the meal. |
| Favorite double-submit | The sheet disables the favorite control while the save/delete mutation is pending. The parent also guards the mutation. |
| Favorite failure state | The star changes only after the favorite callback succeeds, so failed mutations do not leave a false visual state. |
| Sheet error lifetime | Sheet errors are cleared when a sheet opens, closes, or starts a new operation. |
| Weigh-in dates | Empty, incomplete, and impossible calendar dates are rejected in the form. The service rejects invalid `Date` values before any batch write. |
| Progress errors | A failed all-weigh-ins query now shows an error state instead of progress statistics derived from an empty list. |
| Analytics reads | The unused analytics weigh-in query was removed. The snapshot's internal `weighInsInRange` input is optional and defaults to an empty list. |
| Calendar-day math | Local day keys and calendar-day differences are centralized in `date-input.ts`; weekly loss rate and existing day-based consumers are DST-safe. |
| Optimistic meal cache | Concurrent meal mutations append through a functional TanStack Query updater instead of a read-then-write cache race. |

Phase 2 behavior remains in force for profile retry routing, Firestore read validation, AI numeric
clamping, safe new-meal photo persistence, optional-field preservation, reminders, and account
deletion.

---

## Architecture

### Auth redirect recovery

```text
AuthProvider mount
    |
    v
consumeRedirect(auth)
    |
    +--> success: cached result is reused for the module lifetime
    |
    +--> failure: cached promise is cleared, error reaches existing auth UI
                       |
                       +--> later mount can call Firebase again
```

`consumeRedirect` is exported only to support the focused unit test. The profile route decision
continues to use Phase 2's `resolveProfileRoute` and `ProfileLoadError`.

### Quick-look sheet operations

```text
quick-look action
    |
    +--> log meal
    |      |
    |      +--> createMeal fails: set error, keep sheet open, allow retry
    |      +--> createMeal succeeds: best-effort favorite usage update, navigate dashboard
    |
    +--> favorite toggle
           |
           +--> mutation pending: ignore additional taps
           +--> success: update star state
           +--> failure: keep star state, show inline error
```

`MealQuickLookSheet` accepts asynchronous `onLog` callbacks and favorite callbacks that may return
`boolean`, `void`, or a promise. Existing dashboard callbacks that return `void` remain valid.
The log-page callback returns `true` or `false` so the sheet can avoid optimistic state changes
after a failed mutation.

### Weigh-in date flow

```text
date input string
    |
    v
isValidLocalDateInputValue
    |
    +--> invalid/incomplete: selectedDateValue = null, save disabled, message shown
    |
    +--> valid: parse at local noon
                 |
                 v
          saveWeighIn validates again
                 |
                 v
          startOfLocalDay before Firestore write
```

The noon parse avoids DST edge behavior while the service still stores the same local-midnight
weigh-in date as before. Impossible dates are rejected by round-tripping the parsed local date
back to its input string.

### Calendar-day helpers

`lib/utilities/date-input.ts` is the canonical home for:

- `toLocalDateInputValue`
- `toLocalDayKey`
- `dateFromLocalDateInput`
- `isCompleteDateInputValue`
- `isValidLocalDateInputValue`
- `calendarDaysBetween`

`lib/dashboard/date-window.ts` re-exports `toLocalDayKey` as `localDayKey` and
`calendarDaysBetween` as `daysBetween`, preserving existing import paths. Calendar differences
use UTC day numbers derived from local year/month/day fields, so elapsed 23-hour and 25-hour days
do not change the calendar count.

### Analytics snapshot boundary

The analytics page now requests meals only. `BuildAnalyticsSnapshotInput.weighInsInRange` is
optional and defaults to `[]` inside `buildAnalyticsSnapshot`, preserving the current internal
snapshot shape until the dormant insight feature is removed in Phase 4.

The Phase 2 `analyticsWeighIns` query factory and invalidation path remain temporarily in the
repository, but have no production consumer after this phase.

### Optimistic meal cache

```text
meal mutation onMutate
    |
    +--> cancel today's query
    +--> functional setQueryData(old => [...old, entry])
    |
    v
onSettled invalidates today's query and analytics meal queries
```

The server remains authoritative. The functional updater prevents two concurrent optimistic
updates from overwriting one another.

---

## Contracts and Data Models

### Client contracts

- `MealQuickLookSheet.onLog` accepts synchronous or asynchronous callbacks.
- `MealQuickLookSheet.onFavorite` accepts synchronous/asynchronous callbacks and may return a
  success boolean. Existing `void` callbacks remain compatible.
- `useWeighInForm.selectedDateValue` is now `Date | null`; callers must guard it before saving.
- `BuildAnalyticsSnapshotInput.weighInsInRange` is optional and defaults to `[]`.
- `consumeRedirect` is exported for its regression test; it remains an internal auth utility.

### Persisted data

- No Firestore document schema changed.
- No Storage path or security-rule behavior changed.
- Valid weigh-in dates continue to normalize to local midnight before persistence.
- Meal optimistic updates are client-cache behavior only; server meal writes are unchanged.
- The analytics weigh-in read was removed because its only consumer was dormant, non-displayed
  insight weight-change data.

### Copy keys

Added through the typed copy registry:

- `progress.validation.dateRequired`
- `mealLog.sheet.error.logFailed`
- `mealLog.favorites.errorSave`

---

## Verification

```bash
cd calsnap-web
pnpm lint
pnpm test
pnpm build --webpack
```

Results:

- ESLint passed.
- 53 unit test files passed.
- 291 unit tests passed.
- Next.js 16.2.9 production webpack build passed, including TypeScript checking and static page generation.

Added or updated coverage includes:

- Rejected redirect-result retry behavior.
- Ordinary and DST-conditional calendar-day calculations.
- Invalid calendar date rejection.
- DST-spanning weekly loss rate calculation.
- Invalid weigh-in service input.

Manual UI spot-checks remain useful for the quick-look sheet error/rollback states and the
progress error screen. E2E automation is not part of the current repository toolchain.

---

## Deferred to Phase 4

After the analytics fetch removal, Phase 4 C7/C2 should delete:

- `lib/queries/use-analytics-weigh-ins.ts`
- `fetchWeighInsInWindow` from `lib/repositories/weigh-ins.ts`
- The `analyticsWeighIns` query key and invalidation calls
- Related query-key and repository tests
- `BuildAnalyticsSnapshotInput.weighInsInRange`
- `buildInsightPayload` and the dormant insight feature files/tests

The Feb 29 birth-date bounds cosmetic issue, timezone-specific meal bucketing, zero-weight AI
items, and dormant `usdaFoodId` preservation remain tracked residuals.
