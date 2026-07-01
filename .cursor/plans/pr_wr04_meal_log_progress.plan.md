---
name: WR04 Meal Log Progress Implementation
overview: Actionable todos for WR04 meal log + progress review sprint — mirrors wr04_meal_log_progress_c1cd03bd.plan.md
todos:
  - id: baseline-gate
    content: Run merge gate; create PR-WR04.md skeleton with initial baseline §2
    status: completed
  - id: audit-meal-log
    content: Audit W05 meal lifecycle (list, detail, edit, delete, share, invalidation); log findings L1–L8
    status: completed
  - id: audit-progress
    content: Audit W06 weigh-in/progress (sheet, TDEE, chart, reminder, analytics link); log findings W1–W8
    status: completed
  - id: fix-p1-errors
    content: Fix P1 copy-only errors in log delete, WeighInSheet, WeightProgressView, use-meal-share-image
    status: completed
  - id: fix-p2-a11y
    content: "MealDetailActions: Link with button surface classes (no nested button)"
    status: completed
  - id: e2e-meal-log-helpers
    content: meal-log.ts helpers (editScannedItemWeight, expectMealCaloriesChanged); meal-edit-delete.spec.ts (2 tests)
    status: completed
  - id: e2e-weigh-in-helpers
    content: Add tests/e2e/helpers/weigh-in.ts; weigh-in-updates-target.spec.ts with target assertion
    status: completed
  - id: unit-tests
    content: "Optional: invalidateMealQueries / editBaselinesEqual smoke tests only if audit finds gaps"
    status: cancelled
  - id: docs-deliverables
    content: Write PR-WR04.md + .cursor/plans/pr_wr04_meal_log_progress.plan.md; update PR-WR01 helper contract
    status: completed
  - id: final-gate
    content: Run final merge gate; complete acceptance criteria and residual risks in PR-WR04.md
    status: completed
isProject: false
---

# WR04 Implementation Plan

See [wr04_meal_log_progress_c1cd03bd.plan.md](./wr04_meal_log_progress_c1cd03bd.plan.md) for the locked review plan.

Deliverable: [docs/implementation/web/PR-WR04.md](../docs/implementation/web/PR-WR04.md)
