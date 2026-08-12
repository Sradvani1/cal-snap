# V1 Hardening Follow-Up

**Status:** Implemented and verified

**App:** `calsnap-web` (Next.js 16 App Router PWA)

**Parent record:** [PHASE-04-CLEANUP-DEPENDENCIES.md](./PHASE-04-CLEANUP-DEPENDENCIES.md)

**Source audit:** [V1-REVIEW.md](../plans/V1-REVIEW.md) and the post-Phase-4 residual audit

---

## Objective

Close seven minimal residual V1 risks found after the Phase 4 cleanup without introducing a new
feature, changing the Firestore schema, changing security rules, or changing live client-facing API
contracts.

## What Shipped

| Area | Change | User-facing effect |
|------|--------|--------------------|
| Favorites reads | Favorite documents are schema-validated and malformed entries are skipped with a warning. | One damaged favorite no longer breaks the entire Favorites view. |
| Favorite usage | `logFavorite` uses Firestore `increment(1)` instead of read-then-write arithmetic. | Concurrent logs from multiple tabs preserve the correct usage count. |
| Latest weigh-in | The reminder lookup reads a bounded five-document candidate window and skips malformed entries. | A damaged newest weigh-in does not suppress the reminder query. |
| Photo cleanup | A successfully uploaded photo is deleted when the meal path update fails. | Failed saves do not leave unused private Storage objects behind. |
| Account deletion | Storage prefix cleanup is best-effort and idempotent; database/local deletion completes even when Storage is unavailable. | Users do not receive a total deletion failure after core data was already removed. Incomplete Storage cleanup is logged. |
| Photo processing | The full 20-step resolution/quality Cartesian retry grid was reduced to a bounded 12-step sequence. | Large mobile photos use less CPU, memory, battery, and preparation time. |
| Gemini preparation/retry | Image Base64 data is computed once per analysis request; safety-blocked responses are not retried. | Scans avoid repeated encoding work and return deterministic safety failures faster. |

## Architecture

### Favorites Data Flow

```text
fetchFavorites(uid)
  -> Firestore users/{uid}/favorites
  -> mapValidFirestoreDocs
  -> favoriteDocToEntry
  -> favoriteMealDocSchema validation
  -> sorted FavoriteMeal[]
```

`favoriteMealDocSchema` reuses the canonical `foodItemDocSchema`. The mapper now parses raw data
through `parseFirestoreDoc`, so required fields and timestamps cannot silently become empty strings,
zero counts, or plausible fallback values.

Favorite logging updates the existing document with a Firestore numeric transform:

```text
updateDoc(favoriteRef, {
  useCount: increment(1),
  lastUsedAt: current timestamp,
  updatedAt: current timestamp,
})
```

The operation remains scoped to `users/{uid}/favorites/{favoriteId}` and preserves existing
ownership/security behavior.

### Weigh-In Reminder Flow

```text
useWeighInReminder
  -> fetchLatestWeighIn
  -> orderBy(date desc), limit(5)
  -> mapValidFirestoreDocs
  -> first valid WeighIn
```

The candidate limit is intentionally bounded. It avoids an unbounded read while allowing the
reminder to recover from a small number of malformed newest records.

### Meal Photo Save Flow

```text
createMeal(pathless)
       |\
       | uploadMealPhoto
       v  v
  meal saved + photo uploaded
       |
       +-> setMealPhotoPath
              |
              +-> success: return meal with path
              +-> failure: delete uploaded object, return pathless meal
```

`deleteMealPhoto` is already best-effort and logs cleanup failures. The new failure path reuses it
instead of introducing a second Storage deletion implementation.

### Account Deletion Flow

```text
delete meals in Firestore batches
  -> delete referenced meal photos best-effort
delete weigh-ins in batches
delete favorites in batches
delete profile
delete remaining users/{uid}/meals Storage prefix best-effort
clear local user state
```

Storage prefix cleanup now returns success state through recursive calls rather than throwing after
Firestore data is gone. The deletion operation remains idempotent: retrying it is safe for already
deleted documents and Storage objects.

### Image Preparation Flow

`mealPhotoRetrySteps()` now creates this bounded strategy:

1. Try all supported qualities at the preferred resolution.
2. Try the preferred quality at each smaller supported resolution.
3. Try remaining quality fallbacks at the smallest supported resolution.

This preserves a preferred high-quality result when possible while avoiding every resolution/quality
combination.

### Gemini Analysis Flow

`analyzeMealImage` now prepares `imageBase64` before entering `withRetry`, then reuses it for every
attempt. The request-wide 30-second `AbortController` deadline remains the outer bound.

Retryable analysis failures are now:

- Empty responses.
- Invalid JSON responses.
- Network/transport failures.
- HTTP 429.
- HTTP 5xx.

Safety-blocked responses, authentication failures, configuration failures, and other non-retryable
4xx errors stop without another Gemini request.

## API Contracts

- `POST /api/analyze-meal` request and response shapes are unchanged.
- Existing bearer-token verification and API error codes are unchanged.
- Timeout, Base64 reuse, and retry classification are internal server behavior changes.
- No new route, endpoint, or client API was added.

## Data Model Impact

- No Firestore collections, fields, document IDs, indexes, or security rules changed.
- `favoriteMealDocSchema` validates the existing favorite document shape; it does not migrate data.
- `MealTotals`, meal documents, weigh-in documents, and Storage paths retain their existing formats.
- Existing malformed favorites are skipped rather than repaired or deleted.
- Storage cleanup failures remain operationally visible through warnings but do not block core data
  deletion.

## Tests Added or Updated

- Favorite malformed-document skipping.
- Atomic favorite usage increment.
- Malformed latest weigh-in behavior.
- Photo cleanup after meal-path update failure.
- Account deletion when Storage cleanup fails.
- Bounded meal-photo retry sequence.
- Existing integration expectation updated from “throws on malformed latest weigh-in” to “skips it.”

## Post-Hardening Code Cleanup

The final pre-V2 cleanup pass kept the same narrow scope:

- Renamed `ANALYTICS_MIN_INSIGHT_LOGGED_DAYS` to `ANALYTICS_MIN_LOGGED_DAYS` and
  `hasEnoughData` to `hasEnoughLoggedDays` so analytics code no longer references the removed
  insight feature.
- Replaced JSON serialization in meal edit dirty-state detection with direct typed field comparison,
  preserving the existing undo-to-clean behavior.
- Fixed broken build-document links and marked the removed insight record as historical.
- Added focused tests for PWA install storage, overlapping optimistic meal mutations, and the
  analytics logged-day threshold; existing time, onboarding, and settings coverage remains in place.

## Verification

| Check | Result |
|------|--------|
| `pnpm lint` | Passed |
| `pnpm test` | Passed: 55 files / 292 tests |
| `pnpm build --webpack` | Passed |
| `pnpm test:integration` | Passed: 5 files / 23 tests |
| `git diff --check` | Passed |

The integration suite used the Auth, Firestore, and Storage emulators and shut them down
successfully.

## Important Context For V2

The following items remain intentionally outside this hardening pass:

- Per-user Gemini rate limits, quotas, and usage accounting.
- Firestore field/range validation rules and server-enforced document integrity.
- Pagination for full progress history, export, and account deletion reads.
- Account timezone or per-meal local-day data-model support.
- A user-facing recovery path for zero-weight Gemini items.
- Preservation of dormant `usdaFoodId` through meal edits before USDA fallback becomes live.
- Duplicate-favorite uniqueness across tabs/sessions, which requires a product/data contract decision.
- Server-side daily analytics summaries for large meal histories.

These are V2 or dedicated security/data-model work, not blockers for the focused V1 hardening pass.
