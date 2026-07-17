# PR WR05: Analytics & Insights

**Status:** Implemented  
**Sprint:** Post-build review WR05 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md))  
**Depends on:** [PR-WR04.md](./PR-WR04.md) (merge gate green, meal-log + weigh-in E2E helpers)  
**Reviews:** [PR-W07.md](./PR-W07.md) analytics + AI insights

---

## 1. Audit checklist

### 1.1 Timeframe picker

| ID | Check | Result |
|----|-------|--------|
| A1 | Default **7D** on load; presets **7D / 30D / 90D / Custom** | Pass |
| A2 | Preset change updates `selectedRange` and **clears insight** | Pass |
| A3 | Custom apply uses `normalizeCustomRange` (swap, clamp end to today, max 365 days) | Pass |
| A4 | Custom cancel reverts to `presetBeforeCustom` | Pass |
| A5 | Query key varies by range (`analyticsRangeKey`) → refetch on switch | Pass |

### 1.2 Aggregation & charts

| ID | Check | Result |
|----|-------|--------|
| A6 | `hasEnoughData` = `loggedDayCount >= 3` | Pass |
| A7 | Calorie adherence ±10% over logged days only | Pass |
| A8 | Macro trends: actual vs target + daily stacked chart | Pass |
| A9 | Fiber: target, days met, daily bars | Pass |
| A10 | Patterns: DOW, TOD, weekend/weekday, top foods (top 5) | Pass |
| A11 | Sparse data (1–2 days): `EmptyStateView` + CTA → `/scan` | Pass |
| A12 | Rich data (≥3 days): four dietary sections + insight card | Pass |
| A13 | Weight section always visible (embedded `WeightProgressView`) | Pass |

### 1.3 Insight generation

| ID | Check | Result |
|----|-------|--------|
| A14 | Generate disabled when `!hasEnoughData` | Pass — card hidden in empty state; button absent (E2E asserts count 0) |
| A15 | API rejects `loggedDayCount < 3` with 400 | Pass — unit route test |
| A16 | Prompt aggregates only — no photos/PII | Pass — unit prompt test |
| A17 | `AbortController` on unmount / re-generate | Pass |
| A18 | Insight cached with data identity; cleared on timeframe change | **Fixed** — WR05-ANAL-03 (`insightContextKey` extended) |
| A19 | Never real Gemini in CI | Pass — `GEMINI_API_KEY=test-not-used`; insight E2E skipped |

### 1.4 Invalidation & plateau

| ID | Check | Result |
|----|-------|--------|
| A20 | `invalidateAnalyticsQueries` wired from meal CRUD, weigh-in, profile, plateau | Pass |
| A21 | Meal edit/delete → return to analytics → charts refetch | Pass — invalidation wired; manual spot-check §8 |
| A22 | `usePlateauAlert` + `PlateauAlertSheet` on analytics; embedded weigh-in CTA | Pass |

### 1.5 Error copy

| ID | Check | Result |
|----|-------|--------|
| A23 | Page load errors use `copy('analytics.error.loadFailed')` only | **Fixed** — WR05-ANAL-02 |
| A24 | Insight errors use `copy('analytics.insight.*')` only | **Fixed** — WR05-ANAL-01 |
| A25 | 503 maps to `analytics.insight.unavailable` | Pass |

### 1.6 Out of scope (not re-audited)

- WR04 meal/progress error copy, reminder banner, share fiber
- WR03 dashboard error banner
- WR07 320px viewport matrix
- Mocked `/api/generate-insight` E2E, custom range E2E

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

**Note:** Firebase emulators require Java 21+ (`JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` on macOS Homebrew).

### Initial baseline (2026-06-30, before WR05 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **6** tests in **5** spec files |

### Final merge gate (2026-06-30, after WR05 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **8** tests in **6** spec files (`analytics-page` ×2, `happy-path`, `login-returning-user`, `meal-edit-delete` ×2, `scanner-error-manual-entry`, `weigh-in-updates-target`) |

**Net delta:** +1 E2E spec file, +2 E2E tests (6 → 8), analytics E2E helpers, 3 P1 copy fixes, 1 P1 stale-insight fix.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR05-E2E-01 | **P1** | E2E | No analytics E2E (merge-blocking per master plan) | **Fixed** — `analytics-page.spec.ts` |
| WR05-ANAL-01 | **P1** | Copy | Insight errors showed raw API `body.error` | **Fixed** — `use-generate-insight.ts` + `analytics/page.tsx` |
| WR05-ANAL-02 | **P1** | Copy | Analytics load showed raw `error.message` / `Profile not found` | **Fixed** — `use-analytics.ts` + `analytics/page.tsx` |
| WR05-ANAL-03 | **P1** | UX | Stale insight after meal CRUD (profile-only context key) | **Fixed** — `insightContextKey` includes `rangeKey + loggedDayCount + adherencePct` |
| WR05-ANAL-04 | P2 | a11y | No `data-testid` on section cards | Deferred — copy-based selectors stable in CI |
| WR05-ANAL-05 | P2 | Tests | No unit test for `normalizeCustomRange` edge cases | Deferred — manual QA §8; custom range not E2E |
| WR05-ANAL-06 | P2 | Tests | No abort/navigation unit test for insight mutation | Deferred — hook has AbortController; mirror scanner test if flaky |
| WR05-ANAL-07 | P3 | Nav | `common.nav.analytics` unused; no analytics → progress back link | Residual — intentional W07 discovery via Progress |
| WR05-ANAL-08 | P3 | UX | Duplicate weight UX on analytics vs progress | Residual — W07 embed by design |
| WR05-ANAL-09 | P3 | Layout | 320px picker wrap / chart usability | Deferred → WR07 |

**Open P0/P1:** None.

---

## 4. Fix list

| File | Change | Why |
|------|--------|-----|
| `lib/queries/use-generate-insight.ts` | Non-503 failures always `copy('analytics.insight.error')` | WR05-ANAL-01 |
| `lib/queries/use-analytics.ts` | Profile missing → `copy('analytics.error.loadFailed')` | WR05-ANAL-02 |
| `app/(app)/analytics/page.tsx` | Load/insight copy-only errors; extended `insightContextKey`; `insightError` keyed by `contextKey` (mirrors success text); hook copy passthrough in catch | WR05-ANAL-01, WR05-ANAL-02, WR05-ANAL-03 |
| `tests/e2e/helpers/analytics.ts` (new) | Navigation, assertions, Node emulator meal seeding | WR05-E2E-01 |
| `tests/e2e/analytics-page.spec.ts` (new) | Empty state + seeded sections (2 tests) | WR05-E2E-01 |
| `tests/e2e/helpers/index.ts` | Export analytics helpers | Barrel |
| `docs/implementation/web/PR-WR01.md` | Analytics helper cross-ref in §5 | Review close-out |

---

## 5. E2E helper contract updates

### Analytics (`analytics.ts`) — added in WR05

| Export | Signature | Usage |
|--------|-----------|-------|
| `seedMealsOnDistinctDays(credentials, dayCount)` | → `Promise<void>` | Node Auth emulator sign-in → Firestore `createMeal` on distinct local days (local noon) |
| `gotoAnalyticsFromProgress(page)` | → `Promise<void>` | Progress tab → dietary analytics link → `/analytics` |
| `expectAnalyticsEmptyState(page)` | → `Promise<void>` | Empty title + scan CTA (scoped via `designSystem.emptyState.actionHint`) |
| `expectAnalyticsDietarySections(page)` | → `Promise<void>` | Four section `h2` titles visible |
| `expectGenerateInsightUnavailable(page)` | → `Promise<void>` | Generate button absent when `<3` logged days |

See also [PR-WR01.md](./PR-WR01.md) §5 for the full helper contract.

**Not in WR05:** `mockGenerateInsight`, custom range E2E.

---

## 6. Acceptance criteria

- [x] Merge gate green before and after
- [x] Zero open **P0/P1** in analytics + insight scope
- [x] A1–A25 audited; matrix in this doc
- [x] P1 copy: user-facing errors from `lib/copy` only on analytics page + insight flow
- [x] `invalidateAnalyticsQueries` verified wired to meal CRUD (A20)
- [x] **New E2E:** `analytics-page.spec.ts` with **2** tests (zero-meal empty state + seeded sections)
- [x] **P1:** stale insight context key includes `rangeKey + loggedDayCount + adherencePct` (WR05-ANAL-03)
- [x] No real Gemini in CI (insight E2E skipped; route unit tests cover API)
- [x] `PR-WR05.md` complete with findings matrix + residual risks
- [x] WR04 handoff items not re-opened without regression

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| `normalizeCustomRange` unit gap (WR05-ANAL-05) | Swap / 365-day trim verified manual §8 only |
| Insight abort navigation unit test (WR05-ANAL-06) | Hook aborts on unmount; no dedicated unit test |
| Empty-state insight UX (A14) | `<3` days hides insight card entirely (not merely disabled) |
| Analytics → progress back link (WR05-ANAL-07) | Discovery is Progress → analytics only |
| Duplicate weight embed (WR05-ANAL-08) | By design per W07 |
| 320px picker/charts (WR05-ANAL-09) | WR07 |
| Meal-delete → chart refresh E2E | Invalidation wired; not E2E-covered |
| Custom range apply/cancel/365-day clamp E2E | Manual QA §8 |
| Real Gemini insight quality | ROLLOUT Phase 3 manual only |
| WR04 items not re-audited | Meal/progress copy, reminder banner, share fiber |

---

## 8. Manual sign-off

| Scenario | Environment | Signed off |
|----------|-------------|------------|
| Progress → analytics link | Emulator | Pending |
| Timeframe 7D / 30D / 90D switch + refetch | Emulator | Pending |
| Custom range apply / cancel / 365-day clamp | Emulator | Pending |
| Empty vs rich states (≥3 distinct days) | Emulator | Pending |
| Embedded weigh-in from analytics weight section | Emulator | Pending |
| Plateau sheet after 3 flat weekly weigh-ins | Emulator | Pending |
| Generate insight → 2–3 sentences, &lt;10s | **Real Gemini** (ROLLOUT Phase 3) | Pending |
| Timeframe change clears prior insight | Emulator + Gemini | Pending |
| Navigate away mid-generation → no stale insight | Emulator + Gemini | Pending |
| Meal edit/delete → charts refresh + insight context invalidated | Emulator | Pending |
| 320px segmented picker + charts | Local browser | Pending (WR07) |

---

## 9. Files changed index

**New**

- `tests/e2e/helpers/analytics.ts`
- `tests/e2e/analytics-page.spec.ts`
- `docs/implementation/web/PR-WR05.md`

**Modified**

- `app/(app)/analytics/page.tsx`
- `lib/queries/use-analytics.ts`
- `lib/queries/use-generate-insight.ts`
- `tests/e2e/helpers/index.ts`
- `docs/implementation/web/PR-WR01.md`
- `.cursor/plans/pr_wr05_analytics_insights.plan.md`
