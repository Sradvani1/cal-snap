# Historical Phase 2 — Brittle Data Contracts (B1–B8) Implementation Notes

> **Historical archive:** Completed implementation notes moved from the app-local documentation tree.

Master plan: [docs/build/V1-REVIEW.md](./V1-REVIEW.md) — §"Phase 2 — Contracts
& data integrity (B1–B8)". Build index: [docs/build/README.md](./README.md).

**Status: implemented — focused robustness follow-up implemented; automated verification passed;
manual five-profile production preflight pending.** Phase 3 remains on hold until the preflight
is complete.

## Locked scope decisions (from review + stress test)

| Item | Decision |
|------|----------|
| Read validation scope | **Meals and weigh-in list reads, exports, and profile single-document reads.** Favorites stay out of scope and remain a residual risk. |
| List-read semantics | Skip a malformed meal/weigh-in doc with a `console.warn` (collection + doc id + reason); never reject the whole query. Missing documents remain normal empty results. |
| Single-document semantics | `fetchMeal` and `fetchLatestWeighIn` throw on malformed returned data. `undefined` means no document exists. `fetchWeeklyPlateauWeighIns` skips malformed candidates within its existing limited window. |
| Limited queries (`fetchLatestWeighIn`, `fetchWeeklyPlateauWeighIns`) | Operate on the **returned window only**. No unbounded fallback search. A malformed plateau candidate can reduce the candidate pool; a malformed latest document throws. |
| Validation depth | **Minimal semantic checks** — required fields, Firestore `Timestamp`, finite numbers, arrays + nested item shapes, enum values, booleans. No product business-range policy (max weight, calorie plausibility, etc.). |
| Legacy missing fields | **Skip and warn.** No migration, no read-time defaults, no silent compatibility repair. Older records missing now-required fields can disappear from list results. |
| Silent defaults | Remove all `?? 0` / `?? ''` / `?? null` for **required** persisted fields. Optional fields stay optional only where the doc contract defines them. |
| Profile failure | Malformed profile → validation error; `getProfile`/`getProfileWithExtras` fail with retry. App, onboarding, login, and signup gates show a retry state and never redirect a profile read error into onboarding. |
| `isOnboardingComplete()` | No Phase 2 schema work. The function has no callers; remove it as dead code in this phase rather than adding a new validation abstraction. |
| B4 fat semantics | **Accepted, unchanged** — `fatG = saturatedFatG + unsaturatedFatG`. |
| AI numerics (B3) | Clamp negatives to 0 and `confidence` to `[0,1]` in `normalizeFoodItem`, **before** derived calorie/net-carb math. |
| B5/B6 query keys | B6 is **already fixed** in the tree (`invalidateWeighInQueries` → `invalidateAnalyticsQueries` → `analyticsWeighIns`). This phase adds the missing `analyticsWeighIns` key factory + hook usage (B5) and only **verifies** B6. |
| B7 photo failure | Scope to the scan-flow `useLogMeal` creation path. Initially create pathless, upload in parallel, and add the deterministic path only after upload succeeds. Upload failure cleanup remains best-effort; an ambiguous final path-update failure is non-fatal and does **not** delete the uploaded object. Photo replacement is deferred because the deterministic path would overwrite the old object. |
| Weigh-in reminder failure | If the latest-weigh-in query errors, suppress the reminder rather than treating unknown data as no weigh-in. No new error screen. |
| B8 optional-field preservation | `updateMeal` merges existing optional fields into the edited entry before the full replace. `usdaFoodId` preservation stays deferred (B9). |
| B7 numbering | The master plan labels both photo failure and `usdaFoodId` erasure "B7". Photo failure is this phase's item; `usdaFoodId` is renamed **B9** (deferred residual) to avoid ambiguity. |
| Verification gate | `pnpm lint && pnpm test && pnpm build --webpack && pnpm test:integration`. Shared model/repository changes require the production build and emulator verification. |

### Renumbering note

Master plan uses **B7** for both photo-upload failure (`V1-REVIEW.md:201-207`) and the
`usdaFoodId` erasure deferral (`:209-211`). This phase implements the photo item and refers to
the `usdaFoodId` item as **B9** (deferred, see Residual risks).

---

## Workstream 1 — Shared Firestore validation

Add runtime zod schemas beside the existing doc types and validate at the read boundary.
Existing `zod` dependency is used; no new deps.

### Schemas

**`lib/models/meal-entry-doc.ts`**

- Meal: `userId` (string), `timestamp` (Timestamp), `mealType` (enum), all 7 totals (finite
  numbers), `geminiConfidence` (finite number), `isManuallyAdjusted` (boolean), `items`
  (array), `createdAt` + `updatedAt` (Timestamps).
- Optional: `photoStoragePath`, `textDescription`, `estimationNotes`, `usdaFoodId`.
- Food item: `id`, `name` (string), `estimatedWeightG`, 7 nutrition fields, `confidence`
  (finite numbers), `isFlagged` (boolean). Optional: `usdaFoodId`.

**`lib/models/weigh-in-doc.ts`**

- Required: `userId`, `date`, `weightKg`, `createdAt`.
- Optional: `calculatedTDEE`, `adjustedDailyTarget`, `bmi`, `source`.

**`lib/models/profile-doc.ts`**

- Required: all profile fields — name, sex enum, DOB Timestamp, weights/height/targets/TDEE
  (finite numbers), macro pcts, activityLevel enum, onboarding/unit booleans,
  `createdAt`/`updatedAt`.
- `goalTargetDate` is explicitly nullable: `z.instanceof(Timestamp).nullable()`.
- Optional: `weighInReminderEnabled`.

**`lib/models/favorite-meal-doc.ts`** — **out of scope**; no schema added this phase.

### Mapper contract

Change mapper inputs from interface-only casts to runtime-validated data:

```ts
function mealDocToEntry(id: string, raw: unknown): MealEntry
```

1. Parse `raw` with the schema; on failure throw a descriptive error that includes the
   collection and document id (e.g. `meals/abc123: <reason>`).
2. Convert validated `Timestamp`s with `.toDate()`.
3. Never repair missing required values.

`goalTargetDate: null` is a valid persisted profile value, not a missing-field repair; the
profile mapper may continue converting it to domain `null` after schema validation.

For meals, validate the complete document, including every nested food item, **before**
calling `foodItemDocToEntry` or constructing `MealEntry`. Keep the shared food-item mapper's
existing defaults unchanged for the out-of-scope favorites path; validation is what prevents
those defaults from masking invalid meal data.

Use one parse ownership rule: the mapper/helper always calls `schema.parse`; list repositories
call the mapper inside a per-document `try/catch`, warn, and continue; single-document
repositories call the mapper directly and allow the error to propagate. Do not parse each
document twice. A small shared helper module (e.g. `lib/models/validate-doc.ts`) may add the
collection/document context, but it must preserve this single-parse rule.

---

## Workstream 2 — Skip malformed list records (meals + weigh-ins)

Update list reads to map each doc inside a try/catch and continue on failure:

- `lib/repositories/meals.ts`: `fetchMealsForCalendarDay`, `fetchMealsInRange`,
  `fetchAllMeals`.
- `lib/repositories/weigh-ins.ts`: `fetchWeighInsInWindow`, `fetchAllWeighIns`.

On a malformed doc: `console.warn('Skipping malformed <collection> doc <id>:', error)` and
continue. Never catch the whole query.

### Single-doc reads — fail, don't skip

- `fetchMeal` (`meals.ts:96-111`) throws on a malformed meal.
- `fetchLatestWeighIn` (`weigh-ins.ts:66-82`) returns `undefined` only when the query has no
  document and throws if its returned document is malformed. It does not search beyond the
  existing `limit(1)` window.
- `fetchWeeklyPlateauWeighIns` skips malformed docs **within the already-limited candidate
  set** (`limit(count * 4)`, `weigh-ins.ts:53-63`); a corrupt doc reduces candidates, no
  fallback read.

### Profile reads

- `getProfileDoc` (`profile.ts:127-136`): return `null` when the doc doesn't exist; validate
  the full schema when it does; throw a validation error when malformed.
- `getProfile` / `getProfileWithExtras` inherit that failure → `useProfile`
  (`use-profile.ts:8-13`, default retry policy) retries.
- `updateCalorieTargets` already calls `getProfileDoc` → inherits the failure.
- `isOnboardingComplete` has no repository callers. Remove it as dead code in this phase; do
  not add a second profile schema for an unused function.
- `useRequireAuth`, the app layout, onboarding layout, login page, and signup page distinguish
  profile errors from a missing profile. They keep the user out of onboarding and offer retry or
  sign-out recovery.

---

## Workstream 3 — AI numeric bounds (B3)

Update `lib/gemini/meal-analysis-zod.ts` `normalizeFoodItem`:

1. Clamp source fields to `>= 0` **before** derived math: `estimated_weight_g`, `protein_g`,
   `carbs_g`, `fiber_g`, `saturated_fat_g`, `unsaturated_fat_g`.
2. Clamp `confidence` to `[0, 1]`.
3. Then compute `fat_g = saturated_fat_g + unsaturated_fat_g` (B4 unchanged) and
   `netCarbs = max(0, carbs_g - fiber_g)`; calories derive from the clamped values.

No schema change is needed at the zod boundary — normalization guarantees sane inputs before
validation.

---

## Workstream 4 — Analytics query keys (B5) + verify B6

> **Superseded by Phase 4:** The analytics weigh-in query, query key, and related invalidation
> path were removed with the dormant insight feature. The historical implementation details below
> are retained for traceability only.

### B5 — keys

- Add `analyticsWeighIns` to `lib/queries/query-keys.ts` (mirroring `analyticsMeals`).
- Update `lib/queries/use-analytics-meals.ts` and `lib/queries/use-analytics-weigh-ins.ts` to
  build their keys from `queryKeys` instead of inline literals. Preserve the existing
  `rangeStart.getTime()`/`rangeEnd.getTime()` components so resolved windows stay distinct:

  ```ts
  queryKey: [
    ...queryKeys.analyticsMeals(uid ?? '', analyticsRangeKey(range, referenceDate)),
    rangeStart.getTime(),
    rangeEnd.getTime(),
  ],
  ```

### B6 — verify (no behavior change)

`invalidateWeighInQueries` (`invalidate-weigh-ins.ts:4-12`) already calls
`invalidateAnalyticsQueries`, which invalidates `['analyticsWeighIns', uid]`
(`invalidate-analytics.ts:3-9`). Add a test asserting weigh-in mutations invalidate the
analytics weigh-in query key; do not change the invalidation code.

---

## Workstream 5 — New meal photo persistence (B7)

Current bug: `logMeal` writes the new `photoStoragePath` with the meal doc, so an upload
failure leaves a persisted path with no Storage object (`use-log-meal.ts:32-59`).

Scope this fix to the scan-flow creation path. `useLogMeal` creates a new meal; existing meal
edits use `updateMeal` and do not upload replacement photos. The current deterministic Storage
path (`users/{uid}/meals/{mealId}/photo.jpg`) cannot safely support replacement semantics:
uploading a replacement overwrites the old object, so cleaning up a failed replacement could
delete the object referenced by the existing document. Unique paths per upload would be a
separate data-model/storage change and is out of scope.

Keep the parallel upload/write (Phase 1 optimization), but make the initial write pathless and
defer the new path:

1. Build the initial meal entry without `photoStoragePath`. The scan-flow entry is a new meal,
   so there is no existing photo path to preserve.
2. Start `createMeal(initialEntry)` and `uploadMealPhoto(...)` concurrently.
3. Meal write fails → if upload succeeded, best-effort `deleteMealPhoto` for the new object;
   rethrow the meal error.
4. Upload fails → keep the successfully saved meal pathless. Return the initial entry; do not
   perform a restoration write.
5. Both succeed → persist the new path with a targeted
   `setMealPhotoPath(uid, mealId, path)` write via `updateDoc`.
6. Final path update fails → log a warning, leave the uploaded object in Storage, leave the
   meal pathless in the returned result, and do **not** reject the meal mutation. The write may
   have succeeded on the server despite an ambiguous client error; preserving the object is
   safer than deleting a file the document may now reference. Account deletion cleans the
   Storage prefix later.

Persistence rule: a new meal never claims a photo before the corresponding upload has succeeded.
An ambiguous path-update failure may leave a temporary orphan or may have succeeded on the
server; never delete the uploaded object in that ambiguous case.

Add `setMealPhotoPath` to `lib/repositories/meals.ts` (or a merge write) and update
`use-log-meal.ts` to return the entry that reflects reality. The extra path update is the
intentional cost of avoiding ghost paths while retaining parallel upload/write behavior. Photo
replacement, if required later, needs unique Storage paths per upload and is not part of B7.

---

## Workstream 6 — Preserve optional fields on edit (B8)

`updateMeal` (`meals.ts:113-124`) currently reads the existing doc only to keep `createdAt`,
then serializes the caller's entry as a full replace — an omitted optional field is erased.

Update it to merge existing optional fields before serializing:

```ts
const updatedEntry: MealEntry = {
  ...entry,
  photoStoragePath: entry.photoStoragePath ?? existing.photoStoragePath,
  textDescription: entry.textDescription ?? existing.textDescription,
  estimationNotes: entry.estimationNotes ?? existing.estimationNotes,
};
await setDoc(docRef, mealEntryToDoc(updatedEntry, existing.createdAt));
```

- The current detail-page edit (`app/(app)/log/[mealId]/page.tsx:140-154`) spreads the loaded
  meal, so it is unaffected — this is defensive for any future path that builds a partial
  entry.
- Explicit photo removal is **not** added (no nullable-path contract this phase).
- `usdaFoodId` preservation remains deferred (B9).

---

## Workstream 7 — Suppress reminders on weigh-in read errors

`useWeighInReminder` must not interpret a failed `latestWeighIn` query as an empty result. If
`weighInsQuery.isError` is true, return `shouldShow: false` while retaining the existing
loading behavior. No new error surface is required for this banner.

---

## Workstream 8 — Keep account deletion resilient

Phase 2 validation makes `mealDocToEntry` throw for malformed meal documents. Without a
per-document guard, `deleteAllUserData` can stop halfway through a user's meal collection.
Include this narrow safety fix now rather than waiting for Phase 3:

- In `lib/services/user-data-deletion.ts`, wrap the meal callback's `mealDocToEntry` call in a
  `try/catch`.
- On mapper failure, `console.warn` with the meal document id and validation error.
- Skip photo cleanup for that malformed document.
- Still add `docSnap.ref` to the delete batch so the corrupt Firestore document is removed.
- Keep valid-meal cleanup best-effort, then clean the owner-authorized Storage prefix and surface
  prefix cleanup failures to the deletion mutation.
- Do not add pagination or a new deletion abstraction.

This keeps account deletion complete even when a meal cannot be converted to a domain entry.

---

## Test plan

### Unit tests

- `tests/unit/model-mappers.test.ts` — valid round-trips still pass; missing required field
  fails; malformed timestamp fails; malformed nested item fails; optional fields pass.
- `tests/unit/profile-repository.test.ts` — malformed profile throws; missing profile returns
  `null`; `goalTargetDate: null` remains valid; remove/update any test coverage tied to the
  deleted unused `isOnboardingComplete` function.
- `tests/unit/meal-analysis-zod-normalize.test.ts` — negative protein/carbs/fiber/fat
  components/weight clamp to 0; `confidence` below 0 → 0 and above 1 → 1; derived calories +
  net carbs stay nonnegative; normal fixture totals unchanged; `safeParse` success path uses
  clamped values.
- `tests/unit/use-log-meal.test.ts` — upload success persists the new path; upload failure
  leaves a new meal pathless; meal write failure cleans up the uploaded object; final path
  update failure preserves the new object without rejecting the meal; returned entry reflects
  reality. Do not add replacement-upload cases; replacement requires unique Storage paths and
  is out of scope.
- `tests/unit/query-keys.test.ts` — `analyticsMeals`/`analyticsWeighIns` factories produce the
  expected arrays; weigh-in invalidation reaches the `analyticsWeighIns` prefix (B6).
- Repository-level malformed-list tests (mocked snapshots or a tiny helper): a malformed doc
  is skipped with a warning and the remaining valid docs return.
- `tests/unit/user-data-deletion.test.ts` or the emulator flow — a malformed meal skips photo
  cleanup but is still included in the Firestore deletion batch.

### Integration tests (emulators)

- `tests/integration/dashboard-firestore.test.ts` — valid meal + malformed meal returns only
  the valid one with a warning; valid weigh-in + malformed weigh-in returns only the valid
  ones; `fetchLatestWeighIn` throws when the newest doc is malformed; it returns `undefined`
  only when no document exists; `fetchAllWeighIns` skips.
- `tests/integration/meal-crud-firestore.test.ts` — `updateMeal` with an entry omitting
  optional fields preserves the existing photo path/text/notes and `createdAt`.
- `tests/integration/profile-firestore.test.ts` — malformed profile read rejects; valid
  profile with `goalTargetDate: null` remains readable and unchanged.

Assert that a warning occurred and identifies the document; don't couple tests to exact
warning formatting unless it's standardized by the shared helper.

### Manual preflight before deployment

- Inspect all five existing profile documents in the target Firebase project before enabling
  Phase 2 in production.
- Confirm every required profile field is present and correctly typed, including nullable
  `goalTargetDate`, `createdAt`, `updatedAt`, macro targets, unit preferences, and onboarding
  state.
- Resolve any legacy profile issue manually before deployment; do not add migration or
  compatibility defaults to the implementation.

---

## Verification

```bash
cd calsnap-web
pnpm lint && pnpm test && pnpm build --webpack && pnpm test:integration
```

- Focused runs during implementation:

```bash
pnpm exec vitest run tests/unit/model-mappers.test.ts
pnpm exec vitest run tests/unit/profile-repository.test.ts
pnpm exec vitest run tests/unit/meal-analysis-zod-normalize.test.ts
pnpm exec vitest run tests/unit/use-log-meal.test.ts
pnpm exec vitest run tests/integration/dashboard-firestore.test.ts
pnpm exec vitest run tests/integration/meal-crud-firestore.test.ts
```

- Manual spot-checks in `pnpm dev`:
  - Corrupt a meal doc in the emulator; the day list still renders the other meals.
  - Corrupt the profile doc; the dashboard shows a load error (not fabricated zeros).
  - Break a new photo upload (network off) mid-log; the meal saves pathless and without a
    broken/blank photo state.
  - Break the final photo-path update; the meal still saves pathless and the new Storage object
    is preserved because the update may have succeeded on the server.
  - Edit a meal that has a photo; the photo stays after saving.
  - Run account deletion with a malformed meal; deletion continues and removes the document.

---

## Completion criteria

Phase 2 is complete only when:

- Meal and weigh-in list reads validate at runtime; malformed docs are skipped with a warning
  and never reject the query.
- Single-doc reads (`fetchMeal`, `fetchLatestWeighIn`) fail rather than silently return bad
  data; `fetchLatestWeighIn` returns `undefined` only when no document exists.
- Profile single-document reads validate and reject malformed data; `goalTargetDate: null` is
  valid; the unused `isOnboardingComplete` function is removed.
- No required persisted field is silently defaulted to `0`/`''`/`null` on read.
- Validated meal, weigh-in, and profile reads do not mask missing required fields through
  mapper defaults; the shared food-item mapper remains unchanged for out-of-scope favorites.
- AI numeric output is clamped before derived math; B4 behavior unchanged.
- Analytics hooks use centralized `queryKeys` factories; B6 invalidation is covered by a test.
- Failed new-meal photo uploads/path updates never leave a persisted ghost path; new meals
  remain pathless on photo failure, and photo failures do not reject the authoritative meal
  mutation. An ambiguous final path-update failure preserves the uploaded object rather than
  deleting a file the server may already reference. Replacement uploads are not part of this
  phase.
- `updateMeal` preserves omitted optional fields.
- Account deletion still deletes malformed meal documents instead of aborting halfway.
- `pnpm lint && pnpm test && pnpm build --webpack && pnpm test:integration` pass.
- The five existing production profiles pass the manual preflight for required fields before
  deployment.
- A Phase 2 completion note (commit + verification results) is added to
  [`README.md`](./README.md) before Phase 3 resumes.

---

## Out of scope (unchanged from master plan, adjusted by stress-test decisions)

- Favorites validation + silent-default cleanup (existing unsafe casts remain).
- Unbounded fallback search for limited weigh-in queries (`fetchLatestWeighIn`,
  `fetchWeeklyPlateauWeighIns`).
- Photo replacement uploads; deterministic per-meal Storage paths cannot safely distinguish an
  old object from a replacement. Unique paths per upload are deferred.
- `usdaFoodId` preservation on edit (B9, deferred).
- Data migration / read-time repair of legacy docs.
- Business-range validation of persisted nutrition/profile values.
- Data-model changes, Firestore/Storage security-rule changes, live client-facing API changes.

---

## Residual risks updated for this phase

| Item | Risk |
|------|------|
| Profile-error handling | Auth and onboarding gates now distinguish profile errors from missing profiles and expose retry plus sign-out recovery. The five-profile production preflight remains required before sign-off. |
| Limited-query malformed windows | A malformed newest weigh-in throws from `fetchLatestWeighIn`; only a missing document returns `undefined`. A malformed plateau candidate reduces the pool. Accepted (returned-window-only). |
| Favorites unvalidated | `favorites.ts` / `favorite-meal-doc.ts` retain unsafe casts and silent defaults; a corrupt favorite can blank the favorites list. Tracked, not fixed. |
| Legacy missing fields skipped | Older valid docs missing now-required fields can disappear from list results until migrated; no read-time repair. |
| Export omissions | Exports use validated list reads, so malformed records are omitted and warned rather than exported. No separate export error/report is added this phase. |
| Photo path update write | New photo meals incur one additional Firestore write after upload succeeds; an ambiguous failed update is non-fatal and leaves the object for later account-prefix cleanup. |
| Photo replacement | Existing deterministic paths would overwrite the old object, making safe rollback impossible. Replacement requires unique Storage paths per upload and is deferred. |
| B9 `usdaFoodId` erasure (deferred) | Editing a meal drops the dormant `usdaFoodId` field (no consumer; USDA fallback deferred). Preserve on edit when/if the field becomes live. |
| B4 fat semantics (accepted) | `fat = sat + unsat`; missing required split fields remain a validation failure. |
