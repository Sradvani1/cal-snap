# Phase 4 - Cleanup & Dependencies

**Status:** Implemented and verified

**App:** `calsnap-web` (Next.js 16 App Router PWA)

**Source plan:** [V1-REVIEW.md](../plans/V1-REVIEW.md)

**Parent phases:** [Phase 2](./PHASE-02-BRITTLE-DATA-CONTRACTS.md) ·
[Phase 3](./PHASE-03-LATENT-BUGS-DATES.md)

---

## Objective

Reduce dependency and maintenance surface, remove dormant code, consolidate safe duplicate logic,
make Gemini request behavior bounded and predictable, and prune unreachable copy without changing
the Firestore data model or live client-facing API contracts.

## Scope Decisions

| Decision | Result |
|----------|--------|
| Unused dependencies | Removed direct `html2canvas` and `@playwright/test` dependencies. Transitive lockfile entries remain where required by other tooling. |
| Icon library | Kept the existing `lucide-react` dependency and migrated seven hand-written SVG icons to it. |
| Favorite logging | Deleted the dead `useLogFromFavorite` hook and its tests. Kept the live log-page sheet flow because it supports edited items and selected meal type and has safer partial-failure handling. |
| Macro totals | Added one canonical seven-field totals model and used explicit adapters at each differing input shape. |
| Gemini retries | Disabled SDK retries with the installed SDK equivalent, `httpOptions.retryOptions.attempts: 1`; the custom layer owns retries and allows at most three total attempts. |
| Gemini timeout | Added a 30-second request-wide deadline using an `AbortController`, not only a per-attempt SDK timeout. |
| Insight feature | Removed because no current app code consumes it. External callers must be checked before deployment. |
| Compatibility | No Firestore schema, security-rule, persisted-data, or live `/api/analyze-meal` contract changes. |

## Architecture

### UI Icons and Navigation

`components/app/BottomTabNav.tsx` owns the five primary navigation links and now renders Lucide
icons with the existing active-state classes, dimensions, and accessibility behavior.

`components/meal-log/DateNavBar.tsx` uses Lucide chevrons for previous/next day controls. Date
selection, local-day handling, disabled states, and picker behavior remain in the component.

### Canonical Meal Totals

`lib/models/meal-totals.ts` defines the internal `MealTotals` shape:

```text
totalCalories
totalProteinG
totalCarbsG
totalFatG
totalSaturatedFatG
totalUnsaturatedFatG
totalFiberG
```

`emptyMealTotals` creates a zeroed accumulator and `addMealTotals` mutates it in place for efficient
single-pass aggregation.

Adapters connect the canonical shape to the existing domains:

```text
EditableFoodItem[]           -> lib/scanner/meal-totals.ts
Gemini snake_case items      -> lib/gemini/meal-analysis-zod.ts
MealEntry[]                  -> lib/dashboard/aggregate-meals.ts
MealEntry[] by local day     -> lib/analytics/analytics-aggregator.ts
```

The public scanner re-export remains available for existing component consumers. `MealDetailView`
now supplies all seven required fields when it builds a fallback from a persisted `MealEntry`.

### Analytics Window and Dates

`analyticsWindow` in `lib/analytics/analytics-types.ts` centralizes the resolved analytics window,
including the existing exclude-today behavior and preset/custom range semantics.

The short-date formatter in `lib/utilities/unit-formatters.ts` is reused by analytics and progress
charts. Phase 3's local date-input and DST-safe calendar-day work remains the source of truth for
`YYYY-MM-DD` values and day differences.

Settings and onboarding now share draft measurement normalization while preserving the onboarding
profile-step behavior that intentionally does not normalize the goal weight until the goal step.
Reminder preference resolution is shared through `lib/progress/reminder-prefs.ts`.

### Gemini Request Flow

```text
POST /api/analyze-meal
  -> bearer-token verification and FormData validation
  -> analyzeMealImage
  -> one Google GenAI SDK request per custom attempt
  -> normalize and validate the response
  -> MealAnalysisResponse JSON
```

`analyzeMealImage` creates one request deadline and abort signal. `withRetry` receives that deadline,
stops starting new attempts after it expires, and caps the operation at three total attempts.

Retryable failures are:

- Empty or invalid model responses, preserving existing semantic retry behavior.
- Network/transport failures.
- HTTP 429.
- HTTP 5xx.

Authentication, configuration, and other non-retryable HTTP 4xx errors stop immediately. The SDK's
own automatic retry layer is disabled so it cannot multiply the custom retry count.

## API Contracts

### Live Analysis Route

`POST /api/analyze-meal` remains the only Gemini route. It still requires:

- `Authorization: Bearer <Firebase ID token>`.
- Multipart `image` and/or `description` input.
- JPEG or `application/octet-stream` image handling.

Success responses continue to return the existing `MealAnalysisResponse` shape. Existing API error
codes and user-facing copy remain unchanged. Timeout and retry behavior are internal reliability
changes; the route still returns the existing analysis failure response when the operation cannot
complete.

### Removed Dormant Route

`POST /api/generate-insight` and its generator, prompt, schema, tests, and analytics payload were
deleted. No current `app/` or `components/` caller existed. Before production rollout, inspect
deployment access logs and external integrations for any undocumented callers.

## Data Model and Query Impact

- No Firestore collections, document fields, mappers, indexes, or security rules changed.
- `MealTotals` is an in-memory application type only; it is not persisted.
- `analyticsWeighIns`, `use-analytics-weigh-ins.ts`, `fetchWeighInsInWindow`, and related
  invalidation code were removed because the insight payload was the only consumer.
- Analytics meal invalidation remains active for meal changes.
- Removed copy keys were registry entries only; no persisted strings or user data changed.
- Root `/.env.local` is now ignored to reduce accidental secret staging risk.

## Removed Code

The cleanup deleted dead scanner/editing modules, the unused model barrel, the unused favorite hook,
unused progress/analytics exports, the dormant insight implementation, and tests that exclusively
covered those dead paths. Historical build plans were marked as superseded where they described the
removed analytics query or insight route.

## Verification

| Check | Result |
|------|--------|
| `pnpm lint` | Passed |
| `pnpm test` | Passed: 53 files / 285 tests |
| `pnpm build --webpack` | Passed |
| `pnpm test:integration` | Passed: 5 files / 23 tests |
| `git diff --check` | Passed |

The integration run used the Firebase Auth, Firestore, and Storage emulators and shut them down
successfully. A previous run was blocked by occupied ports; the conflicting emulator processes were
stopped before the final successful run.

## User-Visible Impact

- Navigation and date controls use consistent icon components.
- Weight selectors now expose the full canonical supported range and avoid invalid fractional
  selections.
- Meal totals and analytics numbers retain their existing semantics.
- Gemini scanning has a bounded request duration and avoids duplicated retry layers.
- The removed insight code had no current UI consumer, so its removal has no expected visible change.

## Next-Phase Context

- Perform a production smoke test for authentication, meal scanning, meal logging, analytics, and
  weigh-in selection after deployment configuration is loaded.
- Confirm `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` and all Firebase Admin/Gemini secrets are set in
  the deployment environment.
- Check production access logs for `/api/generate-insight` before or immediately after rollout.
- If a future insight feature returns, build it as a new feature with server-derived analytics rather
  than restoring the deleted client-trusted payload path.
- The remaining known product decisions, including zero-weight AI items and dormant `usdaFoodId`
  preservation, remain deferred as documented in `V1-REVIEW.md`.

## V1 Hardening Follow-Up

The post-Phase-4 residual audit produced a focused hardening pass without changing the V1 data
model or feature scope:

- Favorites now validate Firestore documents, skip malformed entries, and increment usage counts
  atomically.
- Latest weigh-in lookup skips malformed candidates within a bounded five-document window.
- Successful photo uploads are cleaned up if attaching the Storage path to the meal fails.
- Account deletion completes database cleanup even when Storage cleanup is temporarily unavailable;
  incomplete cleanup is logged for retry/operations follow-up.
- Photo preparation uses a bounded retry sequence instead of the full resolution/quality grid.
- Gemini image Base64 encoding is performed once per request, and safety-blocked responses are not
  retried.

Follow-up verification passed with **53 unit-test files / 285 tests**, the production webpack build,
and **5 integration files / 23 tests**.
