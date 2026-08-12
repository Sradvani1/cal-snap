# CalSnap Web — V1 Deep Review & Optimization Plan

Post-V1 (feature-complete) audit of `calsnap-web`. Covers correctness, latency, code
cleanup, latent bugs, brittle contracts, and dependency hygiene. Produced from a full
codebase sweep of `app/`, `lib/`, `components/` with every finding verified against
source at `file:line`.

**Build sprint index:** [README.md](../build/README.md) · **Prior optimization:**
[FIRESTORE-OPTIMIZATION.md](../build/FIRESTORE-OPTIMIZATION.md)

**Status:** Complete — Phases 0–4 and the V1 hardening follow-up are implemented. Deferred items
are documented in the Phase 4 build records and are not required before V2.

---

## Locked decisions

| Decision | Choice |
|----------|--------|
| Execution order | **Written plan first** (this doc), then fix phase-by-phase with sign-off between phases |
| Dormant insight feature | **Remove** — `buildInsightPayload` / `insightPayload`, `/api/generate-insight`, `analytics-insight-zod.ts`, `analytics-insight-prompt.ts`, `generate-insight.ts`, and their tests. The weight-change computation (P1-L6/A3) is removed with the feature; no replacement is added (the metric is not shown in any UI). |
| Date handling | **Consolidate, no new deps** — merge the 4 duplicate `YYYY-MM-DD` formatters into `lib/utilities/date-input.ts`; do not add dayjs/date-fns |
| Unused deps | Remove `html2canvas`, `@playwright/test`; keep `lucide-react` and migrate hand-rolled SVGs to it |
| Backend invalidation scope | No data-model changes, no Firestore security-rule changes, no changes to **live client-facing** API contracts |

---

## Stress-test resolutions (locked)

Resolved by reviewing this plan against the code and the Firebase SDK before execution:

| Plan item | Resolution |
|-----------|------------|
| P1-L2 analytics fetch | **Refetch reduction only.** Drop `limit()` and field projection — the Firestore JS client SDK has no field-mask projection, and `limit()` would truncate result sets and corrupt aggregates. Fix `staleTime: 0` and the `visibilitychange` reset so the range refetches only when the local day changes. Keep the 365-day cap. |
| P1-L3 weigh-in cache | **Progress-only derive.** No global namespace unification (a single `allWeighIns` source would make the dashboard fetch the whole collection for a 30-day need). Dashboard stays bounded; progress derives its 30-day/plateau windows from the `allWeighIns` fetch it already makes. |
| P2-B1/B2 read validation | **Skip doc + warn on list reads; fail the single profile read.** No silent zero-defaults. |
| P2-B3/B4 AI numerics | **Clamp only** (negatives → 0, `confidence` → [0,1]). `fat = sat + unsat` behavior **unchanged** — accepted and documented. |
| P3-C6 retry layering | **Single layer, ≤3 attempts + timeout.** SDK `httpOptions.maxRetries: 0`; `withRetry` also retries transport/HTTP errors; explicit `/api/analyze-meal` timeout. |
| P2-A5 zero-weight item | **Defer to product.** No UI affordance in this review; documented as residual risk. |
| P2-B7 `usdaFoodId` | **Document and defer** (dormant field; USDA fallback deferred). No code. |
| Phase ordering | Date-formatter consolidation moves into **Phase 3** (coupled to the DST-safe `daysBetween` fix); no forward references to Phase 4. |
| Out-of-scope wording | "No API contract changes" clarified to "no changes to **live client-facing** API contracts" (C7 deletes a dormant internal route). |

---

## Severity scale

| Level | Definition |
|-------|------------|
| P0 | Data corruption / data loss in a core flow |
| P1 | Feature incorrect vs spec, broken error handling, unbounded latency risk |
| P2 | Latent bug or correctness risk under edge conditions |
| P3 | Polish, cleanup, code quality, dependency hygiene |

---

## Findings inventory (verified)

### Phase 0 — Critical correctness

**P0-1. Double normalization corrupts every AI-scanned meal (carbs & calories).**

`lib/gemini/meal-analysis-zod.ts:182` applies `normalizeMealAnalysisRaw`, then `:186`
delegates to `parseMealAnalysisResponse`, which applies `normalizeMealAnalysisRaw`
**again** (`:159`). Each pass in `normalizeFoodItem` computes
`netCarbs = max(0, carbs_g - fiber_g)` (`:55`) and recomputes calories, so fiber is
subtracted twice whenever an item has fiber.

- Production path `lib/gemini/analyze-meal.ts:137` uses `safeParseMealAnalysisResponse`,
  so **every scanned meal is affected**.
- Verified numerically against `tests/unit/fixtures/meal-analysis.json`: single pass →
  brown rice 28 g carbs / 137 kcal, meal total 366; double pass → 26 g / 129 kcal, meal
  total 358.
- Tests assert only the single-pass path (`tests/unit/meal-analysis-zod-normalize.test.ts:11,20`);
  there is **no assertion on the safeParse success path**.

**P0-2. Analytics custom range leaks one extra day into aggregates.**

`lib/queries/use-analytics-meals.ts:27-31` fetches `rangeStart − 1 day`, but
`lib/analytics/build-analytics-snapshot.ts:117-119` filters fetched meals **only by
upper bound** (`<= rangeEnd`), with no lower bound. For preset `days` ranges the
recomputed start absorbs the extra day (`:110-114`); for **custom** ranges it does not,
so meals from the day before the selected start leak into `loggedDays`,
`loggedDayCount`, `averageDailyCalories`, macro totals, fiber-days, weekend/weekday
averages, and `topFoods`. Only the chart series re-bounds (`:122`).

### Phase 1 — Latency & data layer

**P1-L1. Dashboard reads the entire weigh-in collection to show one banner.**

`useWeighInReminder` (`lib/queries/use-weigh-in-reminder.ts:14-18`) calls
`fetchAllWeighIns` — an unbounded `orderBy('date')` full-collection read
(`lib/repositories/weigh-ins.ts:92-95`) — only to compute
`latestWeighIn(weighInsQuery.data)` (`use-weigh-in-reminder.ts:31`). Mounted on the
first screen a returning user hits (`app/(app)/dashboard/page.tsx:47`). A bounded
"most recent" query (or a small window) suffices.

**P1-L2. Analytics refetches the full meal range on every tab return.**

`useAnalyticsMeals` (`use-analytics-meals.ts:33-44`) fetches the whole range
(`fetchMealsInRange`, `lib/repositories/meals.ts:69-89`; no `limit()`, which is
correct — a limit would truncate aggregates). Custom range allows up to 365 days
(`lib/analytics/analytics-types.ts:5`, enforced `:113-118`). The latency issue is the
refetch pattern: `staleTime: 0` (`use-analytics-meals.ts:43`) plus a `visibilitychange`
→ referenceDate reset (`app/(app)/analytics/page.tsx:54-60`) triggers a fresh full-range
refetch on every return to the tab, and the query key embeds timestamps so each new day
creates a new cache entry. Fix: only reset `referenceDate` when the local day changed,
and give the range queries a small positive `staleTime`. The Firestore web SDK offers no
field-mask projection, so payload trimming is not an option without a data-model change
(out of scope).

**P1-L3. Progress mounts two redundant weigh-in reads.**

Dashboard mounts `usePlateauAlert` → `useRecentWeighIns` (bounded 30-day window +
`limit(12)` plateau, `use-recent-weigh-ins.ts:16-22`) **plus** the reminder
(`dashboard/page.tsx:46-47`). Progress mounts the same plateau read **plus** `useProgress`
→ `useAllWeighIns` (full collection, `progress/page.tsx:18` + `:38`). Minimal dedupe:
do **not** unify cache namespaces (a single `allWeighIns` source would make the dashboard
fetch the whole collection for a 30-day need). Instead, on progress — which fetches all
weigh-ins anyway — derive the 30-day/plateau windows from `allWeighIns` client-side and
drop the redundant `useRecentWeighIns` there. The dashboard's two reads stay as-is
(bounded).

**P1-L4. recharts is in the progress page's critical path.**

`WeightProgressChart` statically imports recharts (`components/progress/WeightProgressChart.tsx:3-11`)
→ `WeightProgressView` (`:8-11`) → `app/(app)/progress/page.tsx:11`. The analytics page
correctly lazy-loads its recharts sections with `next/dynamic({ ssr: false })`
(`analytics/page.tsx:26-48`); the progress page does not.

**P1-L5. Dashboard "today" freezes at mount.**

`use-dashboard.ts:12` — `const now = useMemo(() => new Date(), [])`, combined with
`refetchOnWindowFocus: false` (`lib/queries/query-client.ts:8`) and 30s `staleTime`.
An always-on PWA left open past midnight keeps showing yesterday's meals as "today"
until the route remounts. Same frozen `now` in `use-plateau-alert.ts:30` **and** inside
`useWeighInReminder`'s memo (`use-weigh-in-reminder.ts:20-35`, where
`shouldShowWeighInReminderBanner` computes its own `new Date()` at `weigh-in-reminder.ts:15`).
Fix must cover all three and combine a next-midnight timer with a `visibilitychange`
re-check (background tabs throttle timers).

**P1-L6. Weight-change metric ignores the exclude-today shift (and is otherwise dead work).**

`buildInsightPayload` (`lib/analytics/build-analytics-snapshot.ts:53-97`, called
`:152-166`) computes `weightChangeKg` from `input.weighInsInRange` with no window
filter (`:72-80`), while `use-analytics-weigh-ins.ts:27-31,46` fetches through
`endOfLocalDayExclusive(rangeEnd)` where `rangeEnd` is *today* (pre-shift) — so
today's weigh-in leaks into the reported weight change. No client code consumes
`snapshot.insightPayload`, and `/api/generate-insight` is called by nothing in `app/`
or `components/`. **Removal decision locked; the weight-change computation is removed
with the feature.** Analytics chart series are correctly re-bounded (`:122`).

### Phase 2 — Brittle contracts

**P1-B1. Firestore reads are trusted blindly — zero validation on any read path.**

All repositories cast raw snapshots: `lib/repositories/meals.ts:64-66,86-88,106`,
`weigh-ins.ts:36-38`, `profile.ts:135`, `favorites.ts:28-30`. `mealDocToEntry`
dereferences `doc.timestamp.toDate()` (`meal-entry-doc.ts:48`) and `doc.items.map(...)`
(`:62`) unconditionally; `docToProfile` calls `createdAt.toDate()` (`profile.ts:122-123`).
One malformed doc (partial write, older app version, manual edit) throws and fails the
**entire** day/range query, not just that meal.

**Locked semantics (stress test):** list reads (day/range meals, weigh-ins) **skip a
malformed doc with a `console.warn`** so one corrupt doc doesn't blank the whole query;
the single profile read **fails with retry**. No silent zero-defaults.

**P2-B2. Silent defaults mask corrupt data.**

`food-item-doc.ts:13-14` (`saturatedFatG ?? 0`, `unsaturatedFatG ?? 0`),
`meal-entry-doc.ts:56-57`, `favorite-meal-doc.ts:40,49-50` (`originalMealId ?? ''`,
`useCount ?? 0`, `lastUsedAt?.toDate() ?? null`). Corrupt docs render as valid
zero-macro meals and silently pollute aggregates.

**P1-B3. AI numeric output validated for type only, not range.**

`asNumber` (`meal-analysis-zod.ts:5-16`) accepts any finite number — no
nonnegative/min/max bounds, no `confidence ∈ [0,1]` clamp, no weight bound. Negative
macros from Gemini propagate into `sumEditableItems` totals and Firestore; the
dashboard ring clamps only carbs (`use-dashboard.ts:26`), not protein/sat-fat/unsat-fat/fiber.
**Locked fix:** clamp negatives to 0 and `confidence` to [0,1] in `normalizeFoodItem` —
do not reject the scan over one item.

**P2-B4. `fat_g` recomputed as sat+unsat, silently zeroing if the split is missing.**

`meal-analysis-zod.ts:54` overwrites any Gemini-provided `fat_g`. If the model omits
sat/unsat (older prompt/schema version), fat is silently 0 with no validation failure.
**Locked: accepted behavior — no change.** The app's fat model requires the sat/unsat
split; documented as a known limitation, not a defect to fix in this review.

**P2-B5. Query-key drift.**

`queryKeys.analyticsMeals` / `analyticsWeighIns` defined at
`lib/queries/query-keys.ts:7-9` are never used; the hooks inline their own keys
(`use-analytics-meals.ts:34-40`, `use-analytics-weigh-ins.ts:39-45`). Prefix
invalidation works today, but any future use of the defined key silently no-ops.

**P2-B6. Weigh-in writes don't invalidate analytics weigh-in queries.**

`invalidateWeighInQueries` (`lib/queries/invalidate-weigh-ins.ts:7-9`) misses
`['analyticsWeighIns', …]`. Analytics refetches on mount so the window is small, but a
view that stays mounted shows a stale weight-change metric.

**P1-B7. Silent data loss on photo-upload failure.**

`useLogMeal` runs `Promise.allSettled([createMeal, photoPromise])`
(`lib/queries/use-log-meal.ts:36-58`); if upload rejects but create succeeds, the doc
persists `photoStoragePath` with no Storage object and every later
`getMealPhotoDownloadUrl` (`lib/repositories/meals.ts:156-159`) fails. **Fix:** on upload
failure, drop `photoStoragePath` from the persisted doc.

The related `usdaFoodId` erasure on meal edit (`editable-food-item.ts:103` hardcodes
`usdaFoodId: undefined`; `updateMeal` is a full `setDoc`) is **deferred** — the field is
dormant with no consumer (USDA fallback deferred). Documented as residual risk, not fixed.

**P2-B8. `MealEntry` vs `MealEntryDoc` optional-field asymmetry.**

Domain treats `photoStoragePath`/`textDescription`/`estimationNotes` as optional
(`meal-entry.ts:11-22`) and `mealEntryToDoc` omits them when undefined
(`meal-entry-doc.ts:84-86`); `updateMeal` does a full `setDoc` replace. Any code path
that builds an entry without spreading existing doc fields silently erases the photo
reference.

### Phase 3 — Latent bugs & date risks

**P2-D1. Error-handling gaps.**

- **Profile-query error kicks a signed-in user to /onboarding.** `useRequireAuth`
  (`lib/auth/auth-context.tsx:176-190`): on profile error, `isPending` is false and data
  undefined → `router.replace('/onboarding')`. The onboarding layout only redirects back
  when `onboardingCompleted === true` (`onboarding/layout.tsx:29-31`). No error/retry
  surface. Risk: user re-runs onboarding and overwrites data.
- **Module-level `redirectPromise` caches a rejection forever.** `auth-context.tsx:67-72`
  — once `getRedirectResult` rejects, every future mount re-consumes the same rejection
  and a later successful OAuth redirect can't be re-read.
- **Log-page sheet flows have no error surface.** `MealQuickLookSheet.tsx:162-165` calls
  `onLog`/`onFavorite` without awaiting; `handleSheetLog`/`handleSheetFavorite`
  (`app/(app)/log/page.tsx:151-188`) have `try/finally` with **no catch** — a
  `createMeal` failure is an unhandled rejection and the user sees nothing.
- **`useLogFromFavorite` partial failure orphans a created meal**
  (`lib/queries/use-log-from-favorite.ts:34-41`) — this hook is dead production code
  (see Phase 4 decision on it).
- **Concurrent `useLogMeal` mutations can drop an optimistic entry**
  (`use-log-meal.ts:66-93`): interleaved `onMutate` reads/writes of the same day cache.
  `onSettled` invalidation usually self-heals; if the refetch fails the dropped entry
  persists.
- **Favorites save/delete use `setQueryData` with no server invalidation and no dedup**
  (`use-save-favorite.ts:38-41`, `use-delete-favorite.ts:19-22`); a double-tap can
  create duplicate favorites.
- **Scanner photo prep is not cancelable and can leak a blob URL on unmount**
  (`use-meal-scanner.ts:147-167`).
- **`deleteAllUserData` partial-failure prone** — `getDocs` without pagination; one
  malformed meal doc aborts the whole deletion (`lib/services/user-data-deletion.ts:37-51,107`).
- **Analytics silently ignores the weigh-ins query error** (`analytics/page.tsx:88-89`),
  reporting 0/incorrect weight-change.
- **`WeighInSheet` can submit an invalid date** — cleared input → `new Date(NaN)` →
  `validateWeighInInput` comparisons are false → `Timestamp.fromDate(Invalid Date)`
  throws inside the batch (`lib/progress/use-weigh-in-form.ts:21-24`,
  `lib/services/weigh-in-service.ts:82-94`).

**P2-D2. Timezone/DST risks.**

- **Calendar-day boundaries are client-local while timestamps are UTC instants** — the
  same data buckets into different days across timezones/devices; no timezone captured
  on the doc.
- **`weeklyLossRateKg` divides raw ms deltas by 86400000 with `Math.floor`**
  (`lib/nutrition/calculator.ts:167-169`) — DST-shifted weeks are off by a day, inflating
  the rate ~16%. Same pattern in `daysBetween` (`lib/dashboard/date-window.ts:39-43`),
  driving the reminder (`weigh-in-reminder.ts:26-27`) and plateau spacing (`weigh-ins.ts:71`).
- **Duplicate day-key implementations** — `localDayKey` (`date-window.ts:21-27`) and
  `dayKeyFromDate` (`use-todays-meals.ts:21-26`) are byte-identical but independent; any
  divergence silently breaks cache correctness.
- **DOB bounds on leap-day reference dates** — `setFullYear` normalizes Feb 29 → Mar 1,
  shifting input min/max by a day (`lib/utilities/date-input.ts:29-38`, cosmetic only).

**P2-A5. A zero-weight item from Gemini is a dead end. (Deferred)**

`normalizeFoodItem` defaults missing `estimated_weight_g` to 0 (`meal-analysis-zod.ts:59`);
`canLog` requires every item `weightG > 0` (`use-meal-scanner.ts:90-97`), but the weight
slider is hidden when `estimatedWeightG <= 0` (`MealQuickLookSheet.tsx:33-41`) and
`updateEditableItemWeight` refuses `weightG <= 0` (`editable-food-item.ts:25-27`). The
user must delete the item or re-analyze. **Locked: defer to product** — treat re-analyze/
delete as the intended recovery path; tracked in residual risks. No code in this review.

### Phase 4 — Cleanup & dependencies

**P3-C1. Unused / near-unused dependencies.**

- `html2canvas` — **zero imports** (`package.json:30`; export uses CSV Blob, not
  canvas). Remove.
- `@playwright/test` — **zero imports**, no `playwright.config.*`, e2e deleted
  (`package.json:42`). Remove.
- `lucide-react` — 1 import of 8 icons used (`components/ui/dialog.tsx:5`); 7 SVGs are
  hand-rolled (`components/app/BottomTabNav.tsx:23-104` five nav icons;
  `components/meal-log/DateNavBar.tsx:100-101,128-129` two chevrons). Migrate the
  hand-rolled icons to lucide (locked), making the dep justified.

**P3-C2. Dead modules (no production importers).**

- `lib/scanner/edit-baseline.ts` (97 lines) — test-only.
- `lib/queries/use-log-from-favorite.ts` — test-only; logic duplicated inline in
  `app/(app)/log/page.tsx:125-144` (`favoriteToMealEntry`). Decision: **rewire the log
  flow to use the hook** and delete the inline copy (removes duplication and re-arms the
  P2-D1 partial-failure error path), or delete both if a simpler path wins.
- `components/app/StubPage.tsx` — zero importers.
- `components/scanner/FoodItemRow.tsx` — zero importers; superseded by
  `components/design/FoodItemRowView.tsx`.
- `lib/models/index.ts` — re-export barrel with zero importers.

**P3-C3. Dead exported symbols** (no importers outside their own file; `*` = also not in tests).

- `lib/design/calorie-ring-accessibility.ts:32` `calorieBandIcon`
- `lib/design/motion.ts:12-13` `SHEET_SLIDE_MS`, `SHEET_SLIDE_EASING`
- `lib/design/layout.ts:6` `layout.calorieRing.overStrokeWidth`; `:12-15`
  `layout.sectionCard`; `:35` `layout.touchTarget`; `:21` `layout.tabBar.height` (test-only)
- `lib/utilities/unit-formatters.ts:20` `weightDisplayStep`*; `:75,79,83`
  `clampFeet`*, `clampInches`*, `normalizeHeightCmFromFeetInches`*; `:105`
  `formatHeight`*; `:117` `formatDateShort`*
- `lib/dashboard/calorie-progress.ts:21` `fiberProgressBand` (test-only)
- `lib/analytics/analytics-aggregator.ts:133` `dayOfWeekBreakdown` (test-only); `:145`
  `timeOfDayBreakdown`*
- `lib/analytics/analytics-types.ts:5` `ANALYTICS_MAX_CUSTOM_SPAN_DAYS` (internal);
  `:153` `weekdayShortLabel`*; `:183` `TIME_OF_DAY_BUCKETS`*; `:197` `timeOfDayDisplayLabel`*
- `lib/scanner/error-retry-action.ts:9` `ErrorRetryAction` type
- `lib/scanner/analyze-generation.ts:19` `AnalyzeGenerationGuard` type
- `lib/onboarding/onboarding-step.ts:3` `ONBOARDING_STEPS`, `:21` `onboardingStepIndex` (internal)
- `lib/queries/query-client.ts:16` `getQueryClient` (internal)
- `lib/progress/use-weigh-in-form.ts:102` `setUseLbsConvertsWeight` (test-only; also
  duplicates the inline conversion in `setUseLbs` `:59-69`)
- `lib/pwa/install-storage.ts` — all exports internal-only; `BeforeInstallPromptEvent`
  (`:101`) and the eligibility helpers are unreferenced outside the module

**P3-C4. Duplication — merge candidates.**

1. **Four identical 7-field macro accumulators**: `lib/scanner/meal-totals.ts:13-34`
   (`sumEditableItems`), `lib/gemini/meal-analysis-zod.ts:117-137` (`itemsSumMealTotal`),
   `lib/dashboard/aggregate-meals.ts:17-56` (`aggregateTodaysMeals`),
   `lib/analytics/analytics-aggregator.ts:18-51` (`loggedDailySummaries`). Collapse onto
   one `addTotals(acc, src)` over a common shape; `MealTotals` is the canonical type.
2. **Four duplicate `YYYY-MM-DD` formatters**: `date-window.ts:21-27` (`localDayKey`),
   `use-todays-meals.ts:21-26` (`dayKeyFromDate`), `use-weigh-in-form.ts:14-24`
   (`toDateInputValue`/`dateFromInputValue`), plus `lib/utilities/date-input.ts:6-18`
   (canonical). Consolidate into `date-input.ts` — **executed in Phase 3 D2** (coupled
   to the DST-safe `daysBetween` fix).
3. **`favoriteToMealEntry`** (`use-log-from-favorite.ts:12-29`) vs inline object in
   `app/(app)/log/page.tsx:125-144` — see P3-C2.
4. **Reminder-pref resolution**: `use-settings-form.ts:42-46`
   (`reminderPrefsFromExtras`) is a copy of `lib/progress/reminder-prefs.ts:13-19`
   (`resolveReminderPrefsFromExtras`). Keep the shared one.
5. **Draft normalization** split across `lib/services/save-settings-profile.ts:13-21`
   (`normalizeSettingsDraft`) vs `lib/onboarding/validation.ts:25-39`
   (`normalizeProfileSetupDraft`/`normalizeGoalSetupDraft`). One shared helper.
6. **Analytics window re-derived** in `build-analytics-snapshot.ts:106-115` vs
   `date-window.ts:29-37` + `analytics-types.ts:24-46`. Extract a single
   `analyticsWindow(range, reference)` helper.
7. **`WeightSelector`** (`components/design/WeightSelector.tsx:12,14-18,22-23`)
   redefines `LBS_PER_KG` and its own range/step math instead of using
   `lib/utilities/unit-formatters.ts`.
8. **Short-date formatter** duplicated in 5 files (`CalorieAdherenceSection.tsx:39-41`,
   `FiberSection.tsx:35-37`, `MacroTrendsSection.tsx:32-34`,
   `WeightProgressChart.tsx:40-42`, `unit-formatters.ts:117-119`). One helper.

**P3-C5. Loose ends.**

- `lib/gemini/retry.ts:19` logs a *success* via `console.error`; `:32-35,40-43` emit
  retry chatter on every call. Mis-levelled, noisy (server-side).
- `console.warn` inside catch blocks: `user-data-deletion.ts:57,71,79`, `meals.ts:152`.
- `components/meal-log/MealDetailView.tsx:35-41` — `totalsOverride ?? {...}` fallback
  provides only **5 of 7** required `MealTotals` fields; compiles only because TS infers
  the union. Drift after `MealTotals` gained the fat-split fields.
- `lib/nutrition/calculator.ts:127` — `void currentTDEE; // retained for W06…` dead
  statement.
- `lib/progress/use-weigh-in-form.ts:48` hardcodes `step = 0.1` instead of the exported
  `weightDisplayStep()`.

**P3-C6. Retry layering vs the Gemini SDK. (Locked: single layer, ≤3 attempts + timeout)**

`lib/gemini/retry.ts:9-45` (custom exponential backoff) wraps `generateContent`
alongside `@google/genai`'s built-in `maxRetries` (default 2) and `timeout` (default 60s)
via `httpOptions`. Today, total attempts per analysis can be `3 × 2 = 6` network calls.
**Locked fix:** set SDK `httpOptions.maxRetries: 0`; extend `withRetry` to retry
transport/HTTP failures (429/5xx/network — currently mapped to non-retryable
`requestFailed` in `lib/gemini/analyze-meal.ts:55-61`) as well as the existing semantic
failures, capping at 3 total attempts. Add an explicit server-side timeout to
`/api/analyze-meal`.

**P3-C7. Insight feature — removal scope (locked).**

- `lib/analytics/build-analytics-snapshot.ts` — delete `insightPayload` field (`:42`),
  `buildInsightPayload` (`:53-97`), its call (`:152-166`), and the return field (`:183`).
- `lib/analytics/analytics-types.ts` — delete `AnalyticsInsightPayload` and imports.
- `lib/gemini/analytics-insight-zod.ts`, `lib/gemini/analytics-insight-prompt.ts`,
  `lib/gemini/generate-insight.ts` — delete.
- `app/api/generate-insight/route.ts` — delete.
- `tests/unit/generate-insight-route.test.ts`, `tests/unit/analytics-insight-prompt.test.ts` — delete.
- Keep `hasEnoughData` / `ANALYTICS_MIN_INSIGHT_LOGGED_DAYS` (used by the analytics UI).
- The P1-L6 weight-change leak disappears with the feature; no replacement is added.

**P3-C8. Copy keys — 44 dead keys** (defined in `lib/copy/*`, referenced nowhere
outside `lib/copy/`). Prune, keeping `common.error.notSignedIn` (consumed by
`lib/copy/errors.ts:4`). Notable leftovers of removed UI: `mealLog.favorites.rename*`,
`mealLog.detail.noPhoto`, `mealLog.empty.*`. Verify against `tests/unit/copy.test.ts`
(which asserts shape only, not liveness).

### Test gaps

**Untested modules that back the fixes above** (each Phase 0–4 change must add or update
coverage here):

- `lib/analytics/build-analytics-snapshot.ts` — the P0-2 window math (exclude-today,
  custom-range lower bound) is entirely untested.
- `lib/dashboard/date-window.ts` — only `startOfLocalDay` is exercised; `lastNDaysWindow`,
  `daysBetween`, `calendarDayRange`, `endOfLocalDayExclusive`, `localDayKey` have zero
  test references.
- `lib/queries/use-dashboard.ts`, `use-plateau-alert.ts`, `use-weigh-in-reminder.ts` —
  the P1-L5 frozen-`now` midnight rollover is untested.
- `lib/queries/use-log-meal.ts` optimistic cache race (P2-D1) — partially tested; no
  concurrent-mutation case.
- `lib/gemini/retry.ts`, `lib/gemini/meal-analysis-zod.ts` safeParse success path (P0-1)
  — no direct tests.
- `lib/pwa/install-storage.ts`, `lib/onboarding/use-onboarding.ts`,
  `lib/settings/use-settings-form.ts` — untested. `user-data-deletion.ts` now has Phase 2
  coverage for malformed-meal deletion and is no longer a Phase 3 gap.

**Tests bound to dead code** (rework or remove with the cleanup):
`use-log-from-favorite.test.ts` (dead hook), `fiberProgressBand`/`dayOfWeekBreakdown`
assertions (test-only symbols), `setUseLbsConvertsWeight` (test-only), `edit-baseline`
guards (test-only module). Prefer moving coverage onto the real inlined flows
(`app/(app)/log/page.tsx` favorites, `lib/settings/use-settings-form.ts`).

---

## Execution phases

Each phase is a self-contained PR-sized unit with its own verification and a sign-off
checkpoint before the next begins. Phase 0 is the only blocker.

### Phase 0 — Data integrity (P0-1, P0-2)

1. Fix P0-1: remove the double normalization in `safeParseMealAnalysisResponse`
   (`lib/gemini/meal-analysis-zod.ts:186`) so normalization runs exactly once. Preserve
   `parseMealAnalysisResponse`'s single-normalize contract (it's test-only in production
   but its tests assert normalized totals); fix only the `safeParse` path, mapping the
   zod-validated normalized data directly. Add a success-path regression test asserting
   the same totals as the single-pass path.
2. Fix P0-2: apply a lower bound in `build-analytics-snapshot.ts:117-119` for the
   custom-range case (filter `>= rangeStart` as well as `<= rangeEnd`), or make the
   snapshot consume the exact window it intends. Add unit tests for `days`, `7d`, and
   `custom` ranges, plus an out-of-window meal before `rangeStart`.
3. Verify: `pnpm lint && pnpm test`.

### Phase 1 — Latency & data layer (P1-L1 … P1-L6)

1. L1: replace the reminder's `fetchAllWeighIns` with a bounded most-recent read
   (`limit(1)` ordered by date, or a small window) under its own query key. Keep
   `useAllWeighIns` for progress. Update `use-weigh-in-reminder.ts` and repository
   `lib/repositories/weigh-ins.ts`.
2. L5: un-freeze "today" in `use-dashboard.ts:12`, `use-plateau-alert.ts:30`, and
   `use-weigh-in-reminder` — a shared `now` source that rolls over at the next local
   midnight (timer) **and** re-checks on `visibilitychange` (background tabs throttle
   timers). Add a unit test for the midnight case.
3. L4: lazy-load `WeightProgressChart` with `next/dynamic({ ssr: false })` like the
   analytics page.
4. L3: progress-only derive — on the progress screen, derive the 30-day/plateau windows
   from the `allWeighIns` fetch `useProgress` already makes and drop the redundant
   `useRecentWeighIns` there. Leave the dashboard's bounded reads unchanged.
5. L2: refetch reduction only — give `useAnalyticsMeals`/`useAnalyticsWeighIns` a small
   positive `staleTime`, and make the analytics page's `visibilitychange` reset
   (`analytics/page.tsx:54-60`) fire only when the local day changed so returning to the
   tab within the same day reuses the cache. Do **not** add `limit()` or field projection
   (SDK has no field mask; `limit()` corrupts aggregates). Keep the 365-day cap. Server-side
   aggregation, if ever wanted, is a separate data-model PR (out of scope).
6. L6/removal: see Phase 4 C7 (insight removal) — it also removes the per-snapshot dead
   work.
7. Verify: `pnpm lint && pnpm test && pnpm test:integration` (emulators).

### Phase 2 — Contracts & data integrity (B1–B8)

1. B7 (photo): on upload failure, drop `photoStoragePath` from the persisted doc (or
   clear it in `onSettled` reconcile) so the meal doesn't claim a photo it doesn't have.
2. B1/B2: add zod validation (or defensive guards) to the Firestore read paths that
   dereference required fields (`meal-entry-doc.ts:48,62`, `profile.ts:122-123`).
   **Semantics:** list reads (day/range meals, weigh-ins) skip a malformed doc with a
   `console.warn`; the single profile read fails with retry. Do not keep silent `?? 0`
   defaults.
3. B3: bound AI numeric output in `meal-analysis-zod.ts` — clamp negatives to 0 and
   `confidence` to [0,1] in `normalizeFoodItem`. B4 (`fat = sat + unsat`) stays unchanged.
4. B5/B6: use the defined `queryKeys.analyticsMeals`/`analyticsWeighIns` in the hooks and
   verify the existing `['analyticsWeighIns', …]` invalidation path. Do not duplicate the
   already-correct invalidation implementation.
5. Verify: `pnpm lint && pnpm test`.

> Deferred from Phase 2 (locked): A5 zero-weight affordance and B7 `usdaFoodId` — see
> residual risks.

> Phase 2 implementation also completed the profile-error routing/retry behavior across the
> protected, onboarding, login, and signup gates, plus the malformed-meal account-deletion
> guard. Those items are removed from Phase 3 execution; see the Phase 3 build plan for the
> remaining work and the Phase 2 release gate.

### Phase 3 — Latent bugs & date risks (D1, D2, D3)

1. A1 is complete from Phase 2: reuse `resolveProfileRoute`, `ProfileLoadError`, and
   `resolve-profile-route.test.ts`. Remaining auth work is D1 A2: reset `redirectPromise` on
   failure in `auth-context.tsx:67-72`.
2. D1: add error surfacing to the log-page sheet flows (`log/page.tsx:151-188`) — await
   and catch, show an inline error. Treat `createMeal` as the authoritative save; a
   post-save `logFavorite` failure is best-effort and must not invite a duplicate retry.
   Clear sheet errors when a sheet opens and closes. Reuse mutation pending state for the
   favorite double-submit guard.
3. D1: guard the weigh-in form against Invalid Date before the batch write
   (`use-weigh-in-form.ts:21-24`, `weigh-in-service.ts:82-94`).
4. D1: progress page — show an error instead of zero-based stats when weigh-in loading fails.
   Remove the unused analytics weigh-in fetch rather than adding a banner; make the snapshot
   input optional. Phase 2's analytics query-key/invalidation work remains unchanged until the
   Phase 4 cleanup.
5. D2: consolidate the duplicate day-key functions (`localDayKey` /
   `dayKeyFromDate` / `toDateInputValue`) into `lib/utilities/date-input.ts` (moved here
   from the original Phase 4 C4.2 — it's coupled to the DST-safe `daysBetween` fix) and
   fix the `Math.floor` ms/86400000 day math in `calculator.ts:167-169` /
   `date-window.ts:39-43` to use calendar-day diffing (DST-safe). Add DST-boundary tests.
6. D3: fix the `useLogMeal` optimistic-cache race with an inline functional `setQueryData`
   updater. No helper extraction or dedicated test; preserve Phase 2's photo-persistence logic.
7. Verify: `pnpm lint && pnpm test`, after the Phase 2 five-profile production preflight is
   complete.

### Phase 4 — Cleanup & dependencies (C1–C8)

1. C1: remove `html2canvas`, `@playwright/test` from `package.json`; `pnpm install`.
2. C1: migrate hand-rolled SVGs to `lucide-react` (`BottomTabNav.tsx`, `DateNavBar.tsx`).
3. C2/C3: delete dead modules and dead exports; rewire `app/(app)/log/page.tsx` favorites
   to `use-log-from-favorite` (or delete both per the C2 decision).
4. C4: consolidate the macro accumulators, reminder-prefs, settings/onboarding draft
   normalization, analytics window helper, `WeightSelector`, and the short-date
   formatter. (The four `YYYY-MM-DD` date formatters were consolidated in Phase 3 D2.)
5. C5: fix the `MealDetailView` partial-`MealTotals` fallback, retry logging,
   `console.warn`s, the `void currentTDEE` statement, and the hardcoded `step`.
6. C6: apply the locked retry design — SDK `maxRetries: 0`, `withRetry` also retries
   transport/HTTP errors (≤3 attempts), explicit `/api/analyze-meal` timeout.
7. C7: remove the dormant insight feature per the locked scope.
   Also remove the dead analytics weigh-in aftermath created by Phase 3 D2:
   `use-analytics-weigh-ins.ts`, `fetchWeighInsInWindow`, the `analyticsWeighIns` invalidation
   key/invalidation calls, the optional `weighInsInRange` input, and affected query-key or
   repository tests.
8. C8: prune the 44 dead copy keys.
9. Verify: `pnpm lint && pnpm test && pnpm build` and spot-check the app in `pnpm dev`.

### Test hardening (spans all phases)

Add the missing coverage listed in Test gaps above as each module changes; rework tests
bound to dead code. No phase merges without its verification green.

---

## Verification / merge gate

```bash
cd calsnap-web
pnpm lint && pnpm test && pnpm build          # per phase
pnpm test:integration                          # after any data-layer change (emulators)
```

- Unit: `pnpm exec vitest run tests/unit/<file>.test.ts`
- Integration requires the Firebase emulators (`firebase emulators:exec --project demo-calsnap`).
- PWA/service-worker behavior is validated on a build, not `pnpm dev` (Serwist disabled in dev).

---

## Out of scope (not part of this review)

- Data-model changes, Firestore/Storage security-rule changes, changes to **live
  client-facing** API contracts (C7 deletes a dormant internal route, `/api/generate-insight`,
  which nothing calls).
- Adding new runtime dependencies (date handling stays consolidation-only).
- Persistent client cache (IndexedDB persister) and `onSnapshot` profile listeners — the
  FIRESTORE-OPTIMIZATION "next phase" items; revisit after this review if latency targets
  still need it.
- The frozen `refetchOnWindowFocus: false` policy — revisit only if staleness across tab
  switches becomes a reported issue.

---

## Residual risks (tracked, not scheduled)

| Item | Risk |
|------|------|
| C1 timezone bucketing | A meal logged at 11pm PST reads as "yesterday" from a UTC+14 device. Mitigation would be storing a per-doc day key — a data-model change, deferred. |
| B1 full read-path validation | Scoped to required-field derefs now (skip+warn on lists, fail profile); a full zod schema on every read is a larger follow-up if corrupt docs are observed in production. |
| P2-D2 DST `daysBetween` | Calendar-day diffing fix is scheduled (Phase 3 D2); the residual is only for timezones with non-standard DST transitions. |
| A5 zero-weight item (deferred) | A Gemini item with weight 0 is an unloggable dead end; recovery is delete/re-analyze. Product decision to add a weight-edit affordance later. |
| B7 `usdaFoodId` erasure (deferred) | Editing a meal drops the dormant `usdaFoodId` field (no consumer; USDA fallback deferred). Preserve on edit when/if the field becomes live. |
| B4 fat semantics (accepted) | `fat = sat + unsat`; if Gemini omits the split, fat silently reads 0. Accepted by design — the app requires the sat/unsat split. |
