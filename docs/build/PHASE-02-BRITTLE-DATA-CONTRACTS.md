# Phase 2 — Brittle Data Contracts

**Status:** Implemented — focused robustness follow-up implemented; automated verification passed;
manual five-profile production preflight remains pending.

**App:** `calsnap-web` (Next.js 16 App Router PWA)

**Source plan:** [phase-02-brittle-data-contracts.md](../../calsnap-web/docs/build/phase-02-brittle-data-contracts.md)

**Parent review:** [V1-REVIEW.md](../plans/V1-REVIEW.md)

**Implementation commit:** `0819e78 feat(phase2): harden brittle data contracts`. The release-
blocker follow-up is currently uncommitted and is included in the updated implementation notes
below.

---

## Objective

Make persisted data failures local and visible instead of allowing one malformed record to
break an entire screen or silently turn corrupt values into valid-looking data. The phase
covers meals, weigh-ins, profiles, AI nutrition output, meal photos, edit preservation, account
deletion, and safety behavior around profile errors and reminders. Favorites validation, data
migration, security-rule changes, and the remaining Phase 3 work remain outside this phase.

---

## What Shipped

| Area | Implementation |
|------|----------------|
| Runtime document validation | Added Zod schemas for meal documents, nested meal items, weigh-ins, and profiles. Required fields, Firebase timestamps, finite numbers, enums, arrays, and booleans are checked at read time. |
| Validation errors | Added `parseFirestoreDoc` with collection/document context and `mapValidFirestoreDocs` for per-document list handling. |
| Meal reads | Calendar-day, range, and full meal reads skip malformed returned documents with `console.warn`; single meal reads fail. |
| Weigh-in reads | Window and full-collection reads skip malformed returned documents; latest weigh-in fails when its returned document is malformed; plateau reads skip malformed candidates inside the existing limited window. |
| Profile reads | Full profile reads validate before conversion. `goalTargetDate: null` remains valid. Malformed profiles reject and are retryable through the profile query. App, onboarding, login, and signup gates show retry instead of treating a profile error as a missing profile. Unused `isOnboardingComplete` was removed. |
| AI numerics | Negative nutrition values are clamped to zero and confidence is clamped to `[0, 1]` before calories, fat, and net-carbohydrate calculations. |
| Analytics keys | Added the missing `analyticsWeighIns` key factory and changed both analytics hooks to use centralized key factories. Existing weigh-in analytics invalidation was verified and unchanged. |
| New meal photos | New meals are initially written without a photo path. Upload and meal creation run in parallel; the Storage path is added only after upload succeeds. Upload failures are cleaned up best-effort; an ambiguous final path-update failure is non-fatal and does not delete the uploaded object. |
| Weigh-in reminders | A latest-weigh-in query error suppresses the reminder instead of being interpreted as no weigh-in. |
| Meal edits | `updateMeal` preserves existing `photoStoragePath`, `textDescription`, and `estimationNotes` when an edit omits them. |
| Account deletion | Malformed meal cleanup is warned and skipped, but the Firestore document is still included in the deletion batch. The owner-authorized Storage prefix cleanup now surfaces failures. |

---

## Architecture

### Read validation flow

```text
Firestore query
    |
    v
repository list method
    |
    +--> mapper parses one document with its Zod schema
    |       |
    |       +--> valid: convert timestamps and return domain object
    |       +--> invalid: warn with collection/id and continue
    |
    v
validated domain collection
```

Single-document reads use the same parser but allow the error to propagate. A missing latest
weigh-in remains `undefined`; malformed data returned by that query throws.

`foodItemDocToEntry` remains unchanged for the out-of-scope favorites path. Meal documents are
validated, including all nested items, before that shared mapper is called, so its existing
defaults cannot mask invalid meal data.

### New meal photo flow

```text
scan meal
    |
    +--> create Firestore meal without photoStoragePath
    +--> upload deterministic Storage object in parallel
              |
              +--> upload fails: keep meal pathless, warn, clean up best-effort
              +--> upload succeeds: update Firestore photoStoragePath
                                      |
               +--> update fails: warn, preserve object,
                                           keep meal pathless in result
```

The deterministic path is `users/{uid}/meals/{mealId}/photo.jpg`. This flow is for new scan
meals only. Photo replacement is deferred because the deterministic path would overwrite the
old object and make safe rollback impossible.

### Edit flow

```text
load existing meal
    |
    +--> validate existing Firestore document
    +--> merge omitted optional fields from existing data
    +--> full setDoc with preserved createdAt
```

This protects optional photo/text metadata from future edit paths that construct a partial
`MealEntry`.

### Account deletion flow

```text
read meal batch
    |
    +--> valid meal: best-effort delete referenced photo
    +--> malformed meal: warn and skip photo conversion
    |
    v
delete every Firestore document in the batch
    |
    v
delete the user's Storage prefix and remaining local state
```

---

## Component Relationships

| Layer | Components | Responsibility |
|-------|------------|----------------|
| Document models | `meal-entry-doc.ts`, `weigh-in-doc.ts`, `profile-doc.ts` | Define persisted document contracts, runtime schemas, and domain conversion. |
| Validation utility | `lib/models/validate-doc.ts` | Adds document context to parse failures and implements skip-and-warn list mapping. |
| Repositories | `meals.ts`, `weigh-ins.ts`, `profile.ts` | Execute Firestore/Storage operations and select single-read versus list-read error semantics. |
| Query hooks | `use-analytics-meals.ts`, `use-analytics-weigh-ins.ts`, `use-log-meal.ts`, `use-profile.ts` | Connect repositories to TanStack Query, cache keys, mutations, and invalidation. |
| Domain normalization | `meal-analysis-zod.ts` | Normalizes Gemini output before it becomes a loggable meal. |
| Data deletion | `user-data-deletion.ts` | Deletes user data while tolerating malformed meal records. |

No live client-facing route or API contract changed. Storage rules now permit owner-only prefix
listing so account deletion can remove uploaded objects left after a partial failure.

---

## API Contracts

### Runtime mappers

The meal and weigh-in mappers now accept raw Firestore data and validate it at runtime:

```ts
mealDocToEntry(id: string, raw: unknown): MealEntry
weighInDocToEntry(id: string, raw: unknown): WeighIn
```

The profile repository validates raw data in `getProfileDoc` before `getProfile` and
`getProfileWithExtras` convert it to the domain profile.

### List reads

- Malformed documents returned by meal or weigh-in list queries are skipped.
- Each skipped document produces a warning containing its collection and document ID.
- One malformed document does not reject the list query.
- Exports use these validated list reads, so malformed returned records are omitted.

### Single reads

- `fetchMeal` throws `MealNotFoundError` when absent and a validation error when malformed.
- `fetchLatestWeighIn` returns `undefined` only when no document is returned and throws when its
  returned document is malformed.
- `getProfile` and `getProfileWithExtras` reject malformed profiles; `useProfile` retains the
  default TanStack Query retry behavior.
- Profile errors are distinct from missing profiles in the app, onboarding, login, and signup
  gates; each gate offers retry or sign-out recovery rather than redirecting to onboarding.

### Query keys

Analytics queries use these key shapes:

```ts
['analyticsMeals', uid, rangeKey, rangeStartMs, rangeEndMs]
['analyticsWeighIns', uid, rangeKey, rangeStartMs, rangeEndMs]
```

`invalidateWeighInQueries` already invalidates the `analyticsWeighIns` prefix and was covered by
unit tests without changing its behavior.

---

## Data Model

The Firestore data model is unchanged:

```text
/users/{userId}/
  /profile/main           — ProfileDoc
  /meals/{mealId}         — MealEntryDoc + FoodItemDoc[]
  /weighIns/{weighInId}   — WeighInDoc
  /favorites/{favoriteId} — FavoriteMealDoc (validation out of scope)
```

Required persisted fields are no longer read with silent zero/string defaults. Optional profile
`weighInReminderEnabled` and nullable `goalTargetDate` retain their existing semantics.

---

## Verification

The follow-up verification gate passed:

```text
pnpm lint                         passed
pnpm test                         52 files, 284 tests passed
pnpm build --webpack              passed
integration (alternate ports)     5 files, 23 tests passed
```

The integration suite was run with the Firebase emulator config at
`/var/folders/fj/3_687x1s2r10_tzb_cjrv6y00000gn/T/opencode/calsnap-emulators.json` because the
default emulator ports were occupied by another local workspace. The equivalent
`pnpm test:integration` command can run once those ports are free.

Coverage added for malformed meal/weigh-in records, profile validation and nullable goal dates,
profile-error routing, AI numeric bounds, photo failure paths, optional-field preservation, query
invalidation, weigh-in reminder errors, and malformed-meal account deletion.

---

## Accepted Limitations

- Favorites still use their existing unvalidated mapper and silent defaults.
- Documents missing a Firestore query/order field can be excluded by Firestore before the
  mapper sees them; no additional integrity scan was added.
- Limited weigh-in queries do not search beyond their existing returned window.
- Legacy documents missing required fields may be skipped or rejected; no migration was added.
- An ambiguous final photo-path update can leave an orphaned object or may have succeeded on the
  server; the object is preserved because deleting it could remove the document's newly written
  reference. Account deletion cleans the user's Storage prefix later.
- `usdaFoodId` preservation during edits remains deferred because the field is dormant.
- A profile error now has retry and sign-out recovery in the auth and onboarding gates, but the
  five-profile production preflight is still required before sign-off.

---

## Next Phase Context

Phase 3 remains on hold until the manual preflight confirms all five existing production profile
documents contain the required fields and types.

Before production sign-off, the five existing production profiles must pass the manual preflight.
Future follow-ups may address query-excluded malformed documents, user ID/path consistency in
Firestore rules, favorites validation, and unique Storage paths if photo replacement becomes a
product requirement.
