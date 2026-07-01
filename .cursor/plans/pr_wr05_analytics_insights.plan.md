---
name: WR05 Analytics Insights
overview: Audit W07 analytics + AI insights; fix P1 (copy, stale insight context key); add 2 merge-blocking E2E tests; deliver PR-WR05.md.
todos:
  - id: baseline-gate
    content: Run full merge gate; create PR-WR05.md skeleton with baseline §2 counts
    status: completed
  - id: audit-analytics
    content: Execute audit checklist A1–A25; log findings matrix
    status: completed
  - id: fix-p1
    content: P1 fixes — copy-only errors + insightContextKey (rangeKey, loggedDayCount, adherencePct)
    status: completed
  - id: e2e-helpers
    content: analytics.ts — seedMealsOnDistinctDays(credentials, n), gotoAnalyticsFromProgress, section assertions
    status: completed
  - id: e2e-spec
    content: analytics-page.spec.ts — 2 tests (zero-meal empty state + seeded sections)
    status: completed
  - id: p2-optional
    content: If audit gap only — normalizeCustomRange unit tests
    status: cancelled
  - id: docs-deliverables
    content: Complete PR-WR05.md; update PR-WR01 helper cross-ref
    status: completed
  - id: final-gate
    content: Final merge gate (6→8 E2E); acceptance criteria sign-off
    status: completed
isProject: false
---

# WR05 Implementation Plan

Full plan: `wr05_analytics_insights_d23b2d9d.plan.md` (Cursor plans).

Deliverable: [docs/implementation/web/PR-WR05.md](../docs/implementation/web/PR-WR05.md)

## Locked decisions (round 1 + 2)

| Topic | Choice |
|-------|--------|
| Stale insight | **P1** — extend `insightContextKey` with `rangeKey + loggedDayCount + adherencePct` |
| E2E count | **2 merge-blocking** (6 → 8 total) |
| Empty state test | **Zero meals** after onboarding |
| Meal seeding | **`seedMealsOnDistinctDays(credentials, n)`** — Node Auth emulator sign-in |
| Insight E2E | **Skip** — unit route tests + ROLLOUT Phase 3 |
| API errors | **Client-only** copy fix |
| Custom range | **Manual QA**; unit tests audit-driven only |
| mockGenerateInsight | **Not in WR05** |

## Implementation order

1. Baseline → PR-WR05.md skeleton
2. Audit A1–A25
3. P1 fixes (copy + insight context key)
4. E2E helpers + `analytics-page.spec.ts` (2 tests)
5. Final gate + PR-WR05.md close-out
