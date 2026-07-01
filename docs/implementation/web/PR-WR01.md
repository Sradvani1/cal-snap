# PR WR01: Foundation, CI & Domain Logic

**Status:** Implemented  
**Sprint:** Post-build review WR01 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md))  
**Reviews:** W01 scaffold, shared `lib/` domain layer, CI, unit/E2E test foundation

---

## 1. Audit checklist

| Scope item | Result |
|------------|--------|
| `lib/nutrition/calculator.ts` — iOS `NutritionCalculator` parity | Pass — all 13 functions ported; PR-W01 matrix + 5 new direct tests |
| `lib/models/` — Firestore mappers, activity unions | Pass — round-trip tests added for meal, weigh-in, profile |
| `lib/copy/` — no hardcoded user strings in `app/` or `components/` | Pass — verified; API-route copy deferred to WR07 |
| `.github/workflows/calsnap-web.yml` — merge gate | Pass — lint, unit, build, GEMINI bundle grep, integration, e2e |
| `tests/unit/` — edge case gaps | Pass — P1 gaps closed (mappers + 5 calculator functions) |
| Shared E2E helpers for WR02–WR08 | Pass — auth, api-mocks, fixtures, navigation barrel |
| No real Gemini in CI | Pass — E2E routes mock `/api/analyze-meal`; `.env.e2e` dummy key |

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

### Initial baseline (2026-06-30, before fixes)

| Step | Result | Notes |
|------|--------|-------|
| `pnpm lint` | Pass | |
| `pnpm test` | Pass | 172 tests (34 files) |
| `pnpm build` | Pass | |
| `pnpm test:integration` | **Fail** | Firebase Storage emulator: `Must supply 'target' in Storage configuration` — `firebase.json` used array + `bucket` without `target` (Firebase CLI 14.x) |
| `pnpm test:e2e` | Not run | Blocked by integration failure |

**Fix-first (P0):** Added storage deploy target in `firebase.json` + bucket mapping in `.firebaserc` (see WR01-CI-02 below).

### Final merge gate (2026-06-30, after WR01 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **184** tests (35 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **1** test (happy-path) |

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR01-CI-02 | **P0** | CI | Storage emulator failed — `firebase.json` array config missing `target` | **Fixed** — `target: "default"` + `.firebaserc` bucket targets |
| WR01-E2E-01 | **P1** | E2E | No shared auth/api-mock/fixture utilities | **Fixed** — `tests/e2e/helpers/*` |
| WR01-MAP-01 | **P1** | Models | No round-trip mapper unit tests | **Fixed** — `tests/unit/model-mappers.test.ts` |
| WR01-CAL-01 | **P1** | Nutrition | 5 calculator functions untested directly | **Fixed** — expanded `nutrition-calculator.test.ts` |
| WR01-INPUT-01 | **P1** | Components | `LocalNumberInput` unmount commit refs desynced (passive `useEffect` sync) — step navigation could drop pending edits | **Fixed** — `useLayoutEffect` ref sync + handler updates |
| WR01-CAL-02 | P2 | Nutrition | `dailyTarget` female floor, deficit thresholds, all activity multipliers untested | Deferred |
| WR01-CAL-03 | P2 | Nutrition | JS vs iOS calendar semantics for projection helpers | Documented; fixed-date web tests added |
| WR01-COPY-01 | P2 | Copy | API routes / some `lib/queries` hardcoded English | Deferred → WR07 |
| WR01-COPY-02 | P2 | Copy | `use-generate-insight.ts` raw API errors | Deferred → WR07 |
| WR01-CONST-01 | P3 | Constants | `minAgeYears` 16 vs iOS 18 | Residual risk — intentional web delta |
| WR01-CONST-02 | P3 | Constants | `maxTokens` 4096 vs iOS 2048 | Residual risk — intentional web delta |
| WR01-CONST-03 | P3 | Constants | `defaultReminderWeekday` 0 (JS) vs 1 (Calendar) — same Sunday | Residual risk |
| WR01-CI-01 | P3 | CI | No `merge-gate` npm script | Deferred |
| WR01-DOC-01 | P3 | Docs | `technical-spec.md` stale vs live iOS/web | Residual risk |
| WR01-ARCH-01 | P3 | Models | Profile mappers in `lib/repositories/profile.ts` | Documented; no refactor |

**Open P0/P1:** None.

---

## 4. Fix list

| Change | Why |
|--------|-----|
| `firebase.json` + `.firebaserc` — storage target + bucket mapping | Unblocks Storage emulator (CLI 14.x) and preserves production bucket deploy |
| `tests/unit/model-mappers.test.ts` (new) | Happy-path round-trip for meal, weigh-in, profile mappers |
| `tests/unit/nutrition-calculator.test.ts` — +9 tests | Direct coverage for `macroPercents`, `fiberTargetG`, `weeklyLossRateKg`, `projectedGoalDate`, `projectionPoints` (incl. null/empty edge cases) |
| `tests/e2e/helpers/auth.ts` | `E2E_TEST_PASSWORD`, `uniqueTestEmail`, `signUpWithEmail`, `loginWithEmail`, `createOnboardedUser` → `{ email, password }` |
| `tests/e2e/helpers/api-mocks.ts` | `mockAnalyzeMeal(page, json \| status)` — per-spec mock lifecycle |
| `tests/e2e/helpers/fixtures.ts` | `firstItemName()`, `totalCalories()` from `meal-analysis.json` |
| `tests/e2e/helpers/navigation.ts` | `waitForDashboard()`, `gotoAppRoute()` |
| `tests/e2e/helpers/index.ts` | Barrel re-exports |
| `tests/e2e/happy-path.spec.ts` | Uses shared helpers; fixture-derived assertions |
| `components/design/LocalNumberInput.tsx` | Unmount commit ref sync (`useLayoutEffect` + handler updates) |
| `.gitignore` | Allow `.cursor/plans/` for sprint plan deliverables |

---

## 5. E2E helper contract (WR02–WR08)

Import from `tests/e2e/helpers` (or `./helpers` from spec files).

### Auth (`auth.ts`)

| Export | Signature | Usage |
|--------|-----------|-------|
| `E2E_TEST_PASSWORD` | `'test-password-123'` | Default password for all E2E accounts |
| `uniqueTestEmail()` | `() => string` | `e2e-{timestamp}@example.com` |
| `signUpWithEmail(page, email?, password?)` | → `{ email, password }` | Signup form submit; waits for onboarding URL |
| `loginWithEmail(page, email, password?)` | → `void` | Login form submit; waits for `/dashboard` or `/onboarding` |
| `createOnboardedUser(page)` | → `{ email, password }` | Signup + `completeOnboarding` → dashboard |
| `signOut(page)` | → `void` | Settings → Sign out → `/login` (**added WR02**) |

### API mocks (`api-mocks.ts`)

| Export | Signature | Usage |
|--------|-----------|-------|
| `mockAnalyzeMeal(page, response?)` | `response` = fixture JSON (default) or HTTP status number | Call at **start of each spec** that hits `/api/analyze-meal`. Never rely on global mocks. |

### Fixtures (`fixtures.ts`)

| Export | Returns |
|--------|---------|
| `firstItemName()` | First item name from `fixtures/meal-analysis.json` |
| `totalCalories()` | `mealTotal.calories` from fixture |

### Navigation (`navigation.ts`)

| Export | Usage |
|--------|-------|
| `waitForDashboard(page)` | Assert `/dashboard` URL |
| `gotoAppRoute(page, route)` | Navigate to app path (leading `/` optional) |

### Onboarding (`onboarding.ts`)

| Export | Usage |
|--------|-------|
| `completeOnboarding(page)` | Assumes URL is `/onboarding`; completes 5 steps → dashboard |

### Scanner (`scanner.ts`) — added in WR03

| Export | Signature | Usage |
|--------|-----------|-------|
| `assertTestPhotoExists()` | → `void` | Throws if `helpers/test-photo.jpg` missing |
| `uploadTestPhotoAndAnalyze(page)` | → `Promise<void>` | `/scan` → file input → Analyze (caller waits for result/error) |
| `fillManualMealItem(page, { name, calories, weightG? })` | → `Promise<void>` | Fill first manual entry card |
| `logMealAndExpectDashboard(page, expectedCalories)` | → `Promise<void>` | Log → assert `/dashboard` + kcal link |

Full contract: [PR-WR03.md](./PR-WR03.md) §5 (scanner), [PR-WR04.md](./PR-WR04.md) §5 (meal-log + weigh-in).

### Meal log (`meal-log.ts`) — added in WR04

| Export | Signature | Usage |
|--------|-----------|-------|
| `gotoMealLog(page)` | → `Promise<void>` | Bottom tab → `/log`; wait for `mealLog.title` |
| `openMealRowActions(page, calories)` | → `Promise<void>` | ⋯ on row matching `{calories} kcal` |
| `openMealEditFromLog(page, calories)` | → `Promise<void>` | Menu → Edit → wait `/scan/edit/` |
| `editScannedItemWeight(page, itemName, newWeightG)` | → `Promise<void>` | Item row → `FoodItemEditSheet` → fill weight → Save |
| `saveMealEdits(page)` | → `Promise<void>` | Click Save changes → expect `/log/[mealId]` |
| `expectMealCaloriesChanged(page, previousCalories)` | → `Promise<void>` | Assert kcal link where `N !== previousCalories` |
| `expectMealCaloriesChangedOnSurfaces(page, previousCalories)` | → `Promise<void>` | Detail → `/log` tab → dashboard |
| `deleteMealFromLogList(page, calories)` | → `Promise<void>` | ⋯ → Delete → confirm → wait until kcal link absent (sole E2E delete entry) |
| `expectMealAbsent(page, calories)` | → `Promise<void>` | `{calories} kcal` link not visible on current page |

### Weigh-in (`weigh-in.ts`) — added in WR04

| Export | Signature | Usage |
|--------|-----------|-------|
| `readDashboardCalorieTarget(page)` | → `Promise<number>` | Parse `designSystem.calorieRing.ofGoal` text |
| `openWeighInFromDashboard(page)` | → `Promise<void>` | Click Log weigh-in → expect dialog |
| `fillWeighInWeightKg(page, weightKg)` | → `Promise<void>` | Convert kg → lbs internally; fill dialog input |
| `saveWeighIn(page)` | → `Promise<void>` | Click save → dialog hidden |
| `logWeighInAndExpectLowerTarget(page, newWeightKg)` | → `Promise<void>` | Capture target before → save → assert `newTarget < previousTarget` |

### Not in WR01 (downstream PRs)

`mockGenerateInsight`, settings/analytics/viewport helpers. Login returning-user E2E added in WR02 (`login-returning-user.spec.ts`). Scanner error-path E2E added in WR03 (`scanner-error-manual-entry.spec.ts`). Meal edit/delete + weigh-in target E2E added in WR04 (`meal-edit-delete.spec.ts`, `weigh-in-updates-target.spec.ts`).

---

## 6. Acceptance criteria

- [x] Merge gate green locally
- [x] Zero open P0/P1 in domain layer
- [x] PR-W01 13-case nutrition matrix still passes
- [x] 5 previously untested calculator functions have direct unit tests
- [x] Mapper round-trip tests for meal, weigh-in, profile
- [x] E2E helpers extracted; `happy-path.spec.ts` refactored
- [x] `loginWithEmail` implemented + documented (WR02 validates in CI)
- [x] `createOnboardedUser()` returns `{ email, password }`
- [x] `PR-WR01.md` complete
- [x] No real Gemini in CI

---

## 7. Residual risks

### Intentional web deltas (do not “fix”)

| Constant | Web | iOS | Notes |
|----------|-----|-----|-------|
| `AppConstants.Onboarding.minAgeYears` | 16 | 18 | Product decision for web onboarding |
| `AppConstants.Gemini.maxTokens` | 4096 | 2048 | Web Gemini route uses higher token ceiling |

### Deferred P2/P3

| Risk | Target WR |
|------|-------------|
| `dailyTarget` female floor / deficit threshold edge cases | Residual / follow-up |
| Meal-type boundary hours (4→dinner, 14→lunch) | Residual |
| Calendar/date parity (JS `days×7` vs `Calendar.weekOfYear`) | WR04 if user-visible drift |
| API route hardcoded errors; `use-generate-insight` raw errors | WR07 |
| Firebase auth raw `err.message` on pages | WR02 |
| Profile mapper colocation | Optional follow-up |
| `merge-gate` npm script | P3 anytime |
| `technical-spec.md` stale AppConstants/NutritionCalculator | Out of WR01 scope |
| ESLint copy enforcement rule | WR07 |
| `loginWithEmail` untested in CI until WR02 | WR02 |
| Domain E2E helpers (scanner, meal-log, weigh-in, settings, analytics, viewport) | WR03–WR07 |

---

## 8. Tests added

| File | New tests |
|------|-----------|
| `tests/unit/model-mappers.test.ts` | 3 (meal, weigh-in, profile round-trip) |
| `tests/unit/nutrition-calculator.test.ts` | +9 (`macroPercents` ×2, `fiberTargetG`, `weeklyLossRateKg` ×2, `projectedGoalDate` ×2, `projectionPoints` ×2) |

**Net unit test delta:** +12 (172 → 184).

---

## 9. Files changed

| Path | Change |
|------|--------|
| `calsnap-web/firebase.json` | Storage target config (P0) |
| `calsnap-web/.firebaserc` | Storage bucket targets for production + demo emulators |
| `calsnap-web/tests/unit/model-mappers.test.ts` | New |
| `calsnap-web/tests/unit/nutrition-calculator.test.ts` | Expanded |
| `calsnap-web/tests/e2e/helpers/auth.ts` | New |
| `calsnap-web/tests/e2e/helpers/api-mocks.ts` | New |
| `calsnap-web/tests/e2e/helpers/fixtures.ts` | New |
| `calsnap-web/tests/e2e/helpers/navigation.ts` | New |
| `calsnap-web/tests/e2e/helpers/index.ts` | New |
| `calsnap-web/tests/e2e/happy-path.spec.ts` | Refactored |
| `calsnap-web/components/design/LocalNumberInput.tsx` | Unmount commit ref sync fix |
| `.gitignore` | `!.cursor/plans/` exception |
| `docs/implementation/web/PR-WR01.md` | This document |
| `docs/implementation/web/README.md` | WR01 index status |
| `.cursor/plans/pr_wr01_foundation.plan.md` | Synced implementation plan |
