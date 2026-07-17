# PR WR03: Dashboard & Meal Scanner

**Status:** Implemented  
**Sprint:** Post-build review WR03 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md))  
**Depends on:** [PR-WR02.md](./PR-WR02.md) (merge gate green, E2E helpers)  
**Reviews:** [PR-W03.md](./PR-W03.md) dashboard + [PR-W04.md](./PR-W04.md) scanner/AI pipeline

---

## 1. Audit checklist

### 1.1 Dashboard (W03 core)

| Scope item | Result |
|------------|--------|
| Calorie ring + progress bands | Pass |
| Macro/fiber bars + daily summary footer | Pass |
| Today's meals grouped by `MealType` | Pass |
| 7-day weight sparkline | Pass |
| Plateau alert sheet (diet break / small reduction / snooze) | Pass |
| Scan FAB + bottom tab nav | Pass |
| TanStack Query hooks (`useDashboard`, `useProfile`, `useTodaysMeals`, `useRecentWeighIns`) | Pass |
| Query invalidation after meal log | Pass — `useLogMeal` → `invalidateMealQueries` |
| SessionErrorBanner uses `lib/copy` only | **Fixed** — WR03-DASH-04 |
| Weigh-in sheet on dashboard | Pass (W06 UI present; not re-audited beyond dashboard integration) |

### 1.2 Scanner (W04)

| Scope item | Result |
|------------|--------|
| Phase machine: capture → analyzing → results / error / manual | Pass |
| Client JPEG compression (`meal-photo-processor`) | Pass |
| `POST /api/analyze-meal` with session cookie auth | Pass |
| Manual fallback on 503 / API failure | Pass |
| AbortController + analyze generation guard | Pass — `use-meal-scanner.ts` |
| Unsaved-work guard (tab intercept, Discard, `beforeunload`) | Pass — code review |
| Log → Storage upload + Firestore `createMeal` → query invalidation | Pass |
| Scanner log/save errors use `lib/copy` only | **Fixed** — WR03-SCAN-01 |
| Real Gemini in CI | Pass — mocked via `mockAnalyzeMeal` |

### 1.3 Out of scope (not re-audited)

- Weigh-in UI beyond dashboard banner/sheet trigger
- Meal edit audit (`/scan/edit/[mealId]` — save error fix only)
- 320px viewport matrix (WR07)
- Google OAuth (WR02 handoff)
- Full copy sweep (WR07)

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

**Note:** Firebase emulators require Java 21+ (`JAVA_HOME` for Homebrew `openjdk@21` on macOS).

### Initial baseline (2026-06-30, before WR03 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **2** tests (`happy-path`, `login-returning-user`) |

*Initial run blocked locally when Java runtime stub was unset and port 8080 was occupied by a stale emulator; resolved with `JAVA_HOME` + port cleanup.*

### Final merge gate (2026-06-30, after WR03 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **3** tests (`happy-path`, `login-returning-user`, `scanner-error-manual-entry`) |

**Net delta:** +1 E2E spec, scanner E2E helpers, 5 P1 error-handling fixes, 1 unit test expectation update.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR03-SCAN-01 | **P1** | Scanner | `scan/page.tsx` + `scan/edit/[mealId]/page.tsx` surfaced raw `error.message` on log/save failure | **Fixed** — always `copy('scanner.error.logFailed')` / `saveFailed` |
| WR03-DASH-04 | **P1** | Dashboard | `dashboard/page.tsx`, `use-plateau-alert.ts`, `plateau-actions.ts` surfaced raw errors in `SessionErrorBanner` / plateau actions | **Fixed** — generic `lib/copy` keys only |
| WR03-E2E-01 | **P1** | E2E | No scanner error-path E2E (503 → manual entry) | **Fixed** — `scanner-error-manual-entry.spec.ts` |
| WR03-E2E-02 | **P1** | E2E | Happy-path duplicated scan/upload/log steps inline | **Fixed** — `tests/e2e/helpers/scanner.ts` |
| WR03-SCAN-02 | P2 | Scanner | Storage orphan if Firestore write fails after upload | Deferred — accepted W04 delta; WR08 cleanup |
| WR03-DASH-05 | P2 | Dashboard | Meal/weigh-in query errors share one generic banner | Deferred — no per-query UX distinction |
| WR03-SCAN-06 | P2 | Scanner | No client-side fetch timeout on analyze | Deferred — hung requests fail as generic `api` |
| WR03-SCAN-07 | P2 | Scanner | Header Discard hidden during `analyzing`; tab guard still active | Deferred — residual risk |
| WR03-DASH-01 | P3 | Dashboard | `now` frozen at mount — no midnight rollover without remount | Residual risk |
| WR03-DASH-02 | P3 | Dashboard | Plateau snooze in `localStorage` — lost on clear-site-data | Residual risk — documented W03 delta |
| WR03-DASH-03 | P3 | Dashboard | No automated plateau sheet E2E | Residual risk |
| WR03-SCAN-03 | P2 | Scanner | `navigator.onLine` only — no 2s offline probe (iOS NWPathMonitor) | Deferred — web delta |
| WR03-SCAN-04 | P3 | Scanner | Rate limiting on `/api/analyze-meal` | Deferred → WR08 |
| WR03-COPY-01 | P3 | Copy | API route error strings not in `lib/copy` | Deferred → WR07 |

**Open P0/P1:** None.

---

## 4. Fix list

| File | Change | Why |
|------|--------|-----|
| `app/(app)/scan/page.tsx` | Log catch → `copy('scanner.error.logFailed')` only | WR03-SCAN-01 |
| `app/(app)/scan/edit/[mealId]/page.tsx` | Save catch → `copy('scanner.error.saveFailed')` only | WR03-SCAN-01 |
| `app/(app)/dashboard/page.tsx` | `SessionErrorBanner` → copy keys only | WR03-DASH-04 |
| `lib/queries/use-plateau-alert.ts` | Plateau save catch → copy key | WR03-DASH-04 |
| `lib/dashboard/plateau-actions.ts` | Diet break save catch → copy key | WR03-DASH-04 |
| `tests/unit/plateau-diet-break.test.ts` | Expect copy string on save failure | Regression for WR03-DASH-04 |
| `tests/e2e/helpers/scanner.ts` (new) | `uploadTestPhotoAndAnalyze`, `fillManualMealItem`, `logMealAndExpectDashboard` | WR03-E2E-02 |
| `tests/e2e/helpers/index.ts` | Export scanner helpers | Barrel |
| `tests/e2e/happy-path.spec.ts` | Refactor to scanner helpers | WR03-E2E-02 |
| `tests/e2e/scanner-error-manual-entry.spec.ts` (new) | Mock 503 → manual entry → log → dashboard kcal; `role="alert"` assertion | WR03-E2E-01 |
| `docs/implementation/web/PR-WR01.md` | Scanner helper cross-ref in §5 | Review close-out |
| `.cursor/plans/wr03_dashboard_scanner_fc9beffb.plan.md` | Mark todos completed; superseded note | Review close-out |

---

## 5. E2E helper contract updates

### Scanner (`scanner.ts`) — added in WR03

| Export | Signature | Usage |
|--------|-----------|-------|
| `assertTestPhotoExists()` | → `void` | Throws if `helpers/test-photo.jpg` missing |
| `uploadTestPhotoAndAnalyze(page)` | → `Promise<void>` | `/scan` → set file input → click Analyze. **Does not wait** for analyze outcome — caller must assert results or error. |
| `fillManualMealItem(page, { name, calories, weightG? })` | → `Promise<void>` | Fill first manual entry card (scoped to item card) |
| `logMealAndExpectDashboard(page, expectedCalories)` | → `Promise<void>` | Click Log → assert `/dashboard` + kcal link |

All WR01/WR02 helpers unchanged. Import from `tests/e2e/helpers`.

See also [PR-WR01.md](./PR-WR01.md) §5 for the full helper contract.

---

## 6. Acceptance criteria

- [x] Merge gate green before and after
- [x] Zero open **P0/P1** in dashboard + scanner scope
- [x] Dashboard ring, macros, meals, sparkline, plateau, FAB/tabs wired via TanStack Query
- [x] Scanner: compress → `/api/analyze-meal` (mocked in CI), manual fallback, abort/generation guard, unsaved-work guard
- [x] Log meal → Firestore + Storage → dashboard query invalidation
- [x] **New E2E:** `scanner-error-manual-entry.spec.ts` (503 → manual → dashboard kcal)
- [x] **Refactored E2E:** `happy-path.spec.ts` uses scanner helpers
- [x] `PR-WR03.md` complete with findings matrix + residual risks
- [ ] Real Gemini scan: manual ROLLOUT Phase 3 only (§8 — pending human QA)
- [x] No real Gemini in CI

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| Storage orphan on Firestore fail | Accepted W04 delta; orphaned Storage objects possible until WR08 |
| Generic dashboard error banner (WR03-DASH-05) | Meals/weigh-ins failures show same copy as plateau save errors |
| Midnight rollover (WR03-DASH-01) | `now` frozen at hook mount; dashboard day boundary stale until remount |
| Analyze fetch timeout (WR03-SCAN-06) | No client timeout; hung requests surface as generic API error |
| `navigator.onLine` offline check | No pre-analyze network probe; web delta vs iOS |
| Plateau snooze in `localStorage` | Cleared if user wipes site data |
| `/api/analyze-meal` rate limiting | Not implemented; deferred WR08 |
| Real Gemini quality/latency | CI uses fixture mock only; production sign-off in ROLLOUT Phase 3 |
| 320px scanner/dashboard layout | Deferred to WR07 viewport matrix |

---

## 8. Manual sign-off

### Real Gemini meal scan (ROLLOUT Phase 3 — doc-only, not merge-blocking)

| Scenario | Environment | Signed off |
|----------|-------------|------------|
| Gallery photo → analyze → editable results | Local emulators + `GEMINI_API_KEY` | Pending |
| Camera capture on iOS Safari | Local or device | Pending |
| Log meal with photo → dashboard ring/macros update | Local emulators + real Gemini | Pending |
| Adjust item weight → totals recalculate | Local + real Gemini | Pending |
| Navigate away mid-analyze → no stale results | Local + real Gemini | Pending |
| Low-confidence banner when all items below 0.60 | Local + real Gemini | Pending |
| Manual entry without photo (`geminiConfidence === 0`, no Storage path) | Local emulators | Pending |
| Re-analyze after edit | Local + real Gemini | Pending |
| 503 / timeout → manual entry fallback | CI E2E mock | **Done** — `scanner-error-manual-entry.spec.ts` |
| Tab unsaved-work confirm during results phase | Local manual | Pending |
| Plateau sheet: 3 flat weekly weigh-ins → Diet Break / Small Reduction / Remind Later | Emulator + manual seed | Pending |

### Dashboard spot-checks (emulator, no Gemini)

| Scenario | Signed off |
|----------|------------|
| Seed 3 meals for today → ring/macros/meals list match Firestore totals | Pending |
| Scan FAB and tab nav to `/scan` | Pending |
| 320px: tab bar + FAB usable (full matrix → WR07) | Pending |

---

## 9. Files changed index

**New**

- `tests/e2e/helpers/scanner.ts`
- `tests/e2e/scanner-error-manual-entry.spec.ts`
- `docs/implementation/web/PR-WR03.md`
- `.cursor/plans/pr_wr03_dashboard_scanner.plan.md`

**Modified**

- `app/(app)/scan/page.tsx`
- `app/(app)/scan/edit/[mealId]/page.tsx`
- `app/(app)/dashboard/page.tsx`
- `lib/queries/use-plateau-alert.ts`
- `lib/dashboard/plateau-actions.ts`
- `tests/unit/plateau-diet-break.test.ts`
- `tests/e2e/happy-path.spec.ts`
- `tests/e2e/helpers/index.ts`
- `docs/implementation/web/PR-WR01.md`
- `.cursor/plans/wr03_dashboard_scanner_fc9beffb.plan.md`
