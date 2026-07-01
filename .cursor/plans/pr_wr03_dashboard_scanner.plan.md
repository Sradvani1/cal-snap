---
name: WR03 Dashboard Scanner
overview: WR03 audits and hardens the W03 dashboard and W04 meal scanner core loop. Delivers PR-WR03.md findings, fixes all P0/P1 issues, adds scanner E2E helpers, and merge-blocking E2E for 503 → manual entry.
todos:
  - id: baseline-gate
    content: Run merge gate baseline; record counts in PR-WR03.md §2
    status: completed
  - id: audit-dashboard
    content: Audit dashboard UI → hooks → repos; ring, macros, meals, sparkline, plateau, FAB/tabs, invalidation
    status: completed
  - id: audit-scanner
    content: Audit scanner phases, compress→analyze-meal, manual fallback, abort/generation guard, unsaved-work, log pipeline
    status: completed
  - id: fix-scan-errors
    content: "P1 WR03-SCAN-01: scan pages always copy('scanner.error.logFailed/saveFailed')"
    status: completed
  - id: fix-dash-errors
    content: "P1 WR03-DASH-04: dashboard/plateau generic copy in SessionErrorBanner"
    status: completed
  - id: e2e-scanner-helpers
    content: Add tests/e2e/helpers/scanner.ts; refactor happy-path.spec.ts
    status: completed
  - id: e2e-scanner-503
    content: Add scanner-error-manual-entry.spec.ts (mock 503 → manual → dashboard kcal)
    status: completed
  - id: deliver-docs
    content: Write PR-WR03.md + sync this plan
    status: completed
  - id: final-gate
    content: Run merge gate after fixes; confirm zero open P0/P1
    status: completed
isProject: false
---

# WR03 — Dashboard & Meal Scanner (Core Loop)

**Sprint:** Post-build review PR 3 ([REVIEW-MASTER-PLAN.md](../../docs/implementation/web/REVIEW-MASTER-PLAN.md))  
**Depends on:** [PR-WR02.md](../../docs/implementation/web/PR-WR02.md)  
**Reviews:** [PR-W03.md](../../docs/implementation/web/PR-W03.md), [PR-W04.md](../../docs/implementation/web/PR-W04.md)

---

## Locked decisions (sharpen-plan, 3 rounds)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Error surfacing (WR03-SCAN-01) | Always `copy('scanner.error.logFailed')` / `saveFailed` | Never expose raw Firestore/Storage errors to users |
| Dashboard errors (WR03-DASH-04) | Generic `lib/copy` in `SessionErrorBanner` + plateau actions | Consistent with WR02 auth error mapping |
| Gemini in CI | Mock `/api/analyze-meal` only | Never hit real API in automated tests |
| E2E scanner helpers | `uploadTestPhotoAndAnalyze`, `fillManualMealItem`, `logMealAndExpectDashboard` | Shared by happy-path + error-path specs |
| WR02 handoff | Do not re-audit unless broken | Focus on dashboard + scanner scope |
| Real Gemini QA | ROLLOUT Phase 3 manual only | Not merge-blocking |
| P2/P3 deferral | Document in residual risks unless <30 min | WR07 copy/320px, WR08 rate limiting |

---

## Audit scope

### Dashboard (W03 core)

- `app/(app)/dashboard/page.tsx`
- `components/dashboard/*`
- `lib/dashboard/*`, `lib/queries/use-dashboard.ts`, `use-plateau-alert.ts`
- Query invalidation via `use-log-meal.ts` → `invalidate-meals.ts`

### Scanner (W04)

- `app/(app)/scan/page.tsx`, `app/(app)/scan/edit/[mealId]/page.tsx`
- `components/scanner/*`, `lib/scanner/*`
- `app/api/analyze-meal/route.ts`, `lib/gemini/*`, `lib/services/meal-photo-processor.ts`
- `lib/repositories/meals.ts` (create + upload)
- `components/app/BottomTabNav.tsx` + `unsaved-work-context.tsx`

---

## E2E deliverables

1. **`tests/e2e/helpers/scanner.ts`** — shared upload/analyze, manual fill, log + dashboard assert
2. **`happy-path.spec.ts`** — refactored to use helpers
3. **`scanner-error-manual-entry.spec.ts`** — `mockAnalyzeMeal(page, 503)` → photo → error → Enter manually → log → dashboard kcal

---

## Merge gate

```bash
cd calsnap-web
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

**Final (2026-06-30):** lint ✓ · 201 unit tests ✓ · build ✓ · 11 integration ✓ · 3 E2E ✓

---

## Deliverable

[PR-WR03.md](../../docs/implementation/web/PR-WR03.md) — checklist, findings matrix, fix list, residual risks, acceptance criteria, manual §8 (Phase 3 pending).
