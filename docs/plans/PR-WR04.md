# PR WR04: Meal Log & Progress

**Status:** Implemented  
**Sprint:** Post-build review WR04 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md))  
**Depends on:** [PR-WR03.md](./PR-WR03.md) (merge gate green, scanner E2E helpers)  
**Reviews:** [PR-W05.md](./PR-W05.md) meal log + [PR-W06.md](./PR-W06.md) weigh-in/progress

---

## 1. Audit checklist

### 1.1 Meal log (W05)

| Scope item | Result |
|------------|--------|
| L1 — `/log` groups today by `MealType`; empty sections → `/scan` | Pass |
| L2 — Row tap → detail; ⋯ menu View/Edit/Delete; dashboard rows link-only | Pass |
| L3 — Detail: photo, read-only items, confidence/manual badge, estimation notes | Pass |
| L4 — Edit: `loadForEditing` + baseline guard; Save → `/log/[id]`; dashboard refresh | Pass |
| L5 — Delete: confirm dialog; removed from `/log` + dashboard | Pass |
| L6 — Share: off-screen `MealShareCard` → `html2canvas` → Web Share / download | Pass |
| L7 — User-facing errors use `lib/copy` only | **Fixed** — WR04-MEAL-01, share hook |
| L8 — `MealNotFoundError` → friendly not-found copy | Pass |

### 1.2 Weigh-in & progress (W06)

| Scope item | Result |
|------------|--------|
| W1 — WeighInSheet validation + preview TDEE/target | Pass |
| W2 — Save → batch write weigh-in + profile; `recalculateWeighIn` updates target | Pass |
| W3 — Dashboard ring target updates via `invalidateWeighInQueries` | Pass |
| W4 — Progress chart: ascending line, projection, goal reference | Pass |
| W5 — History newest first; stats recency tie-breaking | Pass (same-day order delta deferred) |
| W6 — Reminder banner: 7+ days, snooze | Pass — manual QA §8 |
| W7 — Progress → analytics link | Pass — manual QA §8 |
| W8 — Save/load errors use `lib/copy` only | **Fixed** — WR04-PROG-01, WR04-PROG-02 |

### 1.3 Out of scope (not re-audited)

- Scanner/dashboard generic error banner (WR03-DASH-05)
- Storage orphan on failed Firestore write → WR08
- Real Gemini manual QA → ROLLOUT Phase 3
- 320px viewport matrix → WR07

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

**Note:** Firebase emulators require Java 21+ (`JAVA_HOME` for Homebrew `openjdk@21` on macOS).

### Initial baseline (2026-06-30, before WR04 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **3** tests (`happy-path`, `login-returning-user`, `scanner-error-manual-entry`) |

### Final merge gate (2026-06-30, after WR04 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **6** tests in **5** spec files (`happy-path`, `login-returning-user`, `scanner-error-manual-entry`, `meal-edit-delete` ×2, `weigh-in-updates-target`) |

**Net delta:** +2 E2E spec files (+2 test blocks, 3 → 6 tests), meal-log + weigh-in E2E helpers, 5 P1 error-copy fixes, 1 P2 a11y fix.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR04-MEAL-01 | **P1** | Meal log | Delete errors surfaced raw `error.message` on log list + detail pages | **Fixed** — always `copy('mealLog.error.deleteFailed')` |
| WR04-PROG-01 | **P1** | Progress | `WeighInSheet` save catch used `err.message` fallback | **Fixed** — always `copy('progress.weighIn.error.saveFailed')` |
| WR04-PROG-02 | **P1** | Progress | `WeightProgressView` surfaced `progress.error.message` | **Fixed** — copy keys only |
| WR04-E2E-01 | **P1** | E2E | No meal edit + delete E2E | **Fixed** — `meal-edit-delete.spec.ts` |
| WR04-E2E-02 | **P1** | E2E | Happy-path weigh-in had no target assertion | **Fixed** — `weigh-in-updates-target.spec.ts` |
| WR04-MEAL-02 | P2 | a11y | `MealDetailActions`: `<button>` inside `<Link>` | **Fixed** — styled `Link` with button surface classes |
| WR04-MEAL-03 | P2 | UX | Log delete failure: dialog closes, must re-open ⋯ | Deferred → residual risks |
| WR04-MEAL-04 | P2 | Tests | `meal-share-card.test.ts` never renders `MealShareCard` | Deferred → residual risks; manual §8 |
| WR04-PROG-03 | P2 | Progress | History sort vs stats tie-break may differ same-day | Deferred → residual risks |
| WR04-PROG-04 | P2 | Reminder | Banner `dismissed` state not tied to snooze on first click | Deferred → residual risks; manual §8 |
| WR04-PROG-05 | P2 | Tests | No unit test for exactly 7 days overdue boundary | Deferred → residual risks |
| WR04-MEAL-05 | P3 | Share | Share card shows P/C/F only (no fiber) | Residual — iOS parity check |
| WR04-PROG-06 | P3 | Progress | `didTriggerPlateau` ignored on dashboard/progress | Residual — plateau uses `usePlateauAlert` |
| WR04-PROG-07 | P3 | Reminder | Weekday/hour/minute prefs stored but banner is days-since-only | Residual — settings UI in W06 |
| WR04-ARCH-01 | P3 | Queries | `useWeighInReminder` duplicates `allWeighIns` fetch | Residual — cache-shared |

**Open P0/P1:** None.

---

## 4. Fix list

| File | Change | Why |
|------|--------|-----|
| `app/(app)/log/page.tsx` | Delete catch → `copy('mealLog.error.deleteFailed')` only | WR04-MEAL-01 |
| `app/(app)/log/[mealId]/page.tsx` | Same | WR04-MEAL-01 |
| `components/progress/WeighInSheet.tsx` | Save catch → `copy('progress.weighIn.error.saveFailed')` only | WR04-PROG-01 |
| `components/progress/WeightProgressView.tsx` | Load errors → copy keys only | WR04-PROG-02 |
| `components/meal-log/use-meal-share-image.ts` | Non-abort errors → `copy('mealLog.share.error.failed')` only | WR04 locked P1 |
| `components/meal-log/MealDetailActions.tsx` | Replace nested button with styled `Link` | WR04-MEAL-02 |
| `components/meal-log/MealDetailView.tsx` | `data-testid="meal-detail-total-calories"` on total | E2E selector stability |
| `tests/e2e/helpers/meal-log.ts` (new) | Meal log E2E helpers | WR04-E2E-01 |
| `tests/e2e/helpers/weigh-in.ts` (new) | Weigh-in E2E helpers | WR04-E2E-02 |
| `tests/e2e/helpers/index.ts` | Export new helpers | Barrel |
| `tests/e2e/meal-edit-delete.spec.ts` (new) | Edit + delete independent tests | WR04-E2E-01 |
| `tests/e2e/weigh-in-updates-target.spec.ts` (new) | Relative target decrease | WR04-E2E-02 |
| `docs/plans/PR-WR01.md` | Meal-log + weigh-in helper cross-ref in §5 | Review close-out |

---

## 5. E2E helper contract updates

### Meal log (`meal-log.ts`) — added in WR04

| Export | Signature | Usage |
|--------|-----------|-------|
| `gotoMealLog(page)` | → `Promise<void>` | Bottom tab → `/log`; wait for `mealLog.title` |
| `openMealRowActions(page, calories)` | → `Promise<void>` | ⋯ on row matching `{calories} kcal` |
| `openMealEditFromLog(page, calories)` | → `Promise<void>` | Menu → Edit → wait `/scan/edit/` |
| `editScannedItemWeight(page, itemName, newWeightG)` | → `Promise<void>` | Item row → `FoodItemEditSheet` → fill weight → Save |
| `saveMealEdits(page)` | → `Promise<void>` | Click Save changes → expect `/log/[mealId]` |
| `expectMealCaloriesChanged(page, previousCalories)` | → `Promise<void>` | Assert kcal link visible where `N !== previousCalories` |
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

See also [PR-WR01.md](./PR-WR01.md) §5 for the full helper contract.

---

## 6. Acceptance criteria

- [x] Merge gate green before and after
- [x] Zero open **P0/P1** in meal log + progress scope
- [x] Meal list/detail/edit/delete/share audited vs W05
- [x] Weigh-in → TDEE recalc → dashboard target audited vs W06
- [x] Query invalidation verified for meal CRUD and weigh-in writes
- [x] **New E2E:** `meal-edit-delete.spec.ts` (2 independent tests)
- [x] **New E2E:** `weigh-in-updates-target.spec.ts` (relative target decrease)
- [x] **P2 locked:** `MealDetailActions` a11y fix
- [x] `PR-WR04.md` complete with findings matrix + residual risks
- [x] No real Gemini in CI

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| Delete failure UX (WR04-MEAL-03) | Dialog closes on error; user must re-open ⋯ |
| Share card unit test gap (WR04-MEAL-04) | Share verified manual §8 only |
| History sort vs stats tie-break (WR04-PROG-03) | Same-day order may differ between list and stats |
| Reminder dismiss/snooze edge (WR04-PROG-04) | Manual snooze check §8 |
| 7-day overdue boundary unit test (WR04-PROG-05) | 8-day case exists; exact boundary untested |
| Share card no fiber (WR04-MEAL-05) | iOS parity check deferred |
| `didTriggerPlateau` not surfaced on progress (WR04-PROG-06) | Plateau uses separate refetch path |
| Reminder weekday/hour prefs unused in banner (WR04-PROG-07) | Days-since-only banner |
| `useWeighInReminder` duplicate fetch (WR04-ARCH-01) | Cache-shared; no refactor |
| Storage orphan on Firestore fail | WR08 |
| Generic dashboard error banner (WR03-DASH-05) | Not re-audited |
| 320px layout matrix | WR07 |

---

## 8. Manual sign-off

| Scenario | Environment | Signed off |
|----------|-------------|------------|
| Log 2–3 meals → `/log` sections + dashboard links | Emulator | Pending |
| Detail photo, confidence, estimation notes | Emulator + Storage | Pending |
| Edit item weights → totals on detail + ring consumed | Emulator | Pending |
| Delete from detail page (E2E uses log ⋯ only) | Emulator | Pending |
| Share → PNG download/share | Local browser (html2canvas) | Pending |
| Weigh-in sheet validation (out of range, future date) | Emulator | Pending |
| Progress chart projection (≥2 weigh-ins) | Emulator | Pending |
| Overdue banner after 7+ days | Manual only | Pending |
| Snooze “Remind me tomorrow” persists reload | Manual only | Pending |
| Progress → analytics link | Manual only | Pending |

---

## 9. Files changed index

**New**

- `tests/e2e/helpers/meal-log.ts`
- `tests/e2e/helpers/weigh-in.ts`
- `tests/e2e/meal-edit-delete.spec.ts`
- `tests/e2e/weigh-in-updates-target.spec.ts`
- `docs/plans/PR-WR04.md`
- `.cursor/plans/pr_wr04_meal_log_progress.plan.md`

**Modified**

- `app/(app)/log/page.tsx`
- `app/(app)/log/[mealId]/page.tsx`
- `components/progress/WeighInSheet.tsx`
- `components/progress/WeightProgressView.tsx`
- `components/meal-log/use-meal-share-image.ts`
- `components/meal-log/MealDetailActions.tsx`
- `components/meal-log/MealDetailView.tsx`
- `tests/e2e/helpers/index.ts`
- `docs/plans/PR-WR01.md`
- `.cursor/plans/wr04_meal_log_progress_c1cd03bd.plan.md`
