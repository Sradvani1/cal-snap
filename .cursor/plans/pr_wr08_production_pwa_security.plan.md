---
name: WR08 Production PWA Security
overview: "Final review-sprint PR: audit PWA, privacy, security rules, and production paths against live Firebase + Vercel; fix all P0/P1; implement targeted P2 hardening (storage orphan cleanup, Firestore deny tests); run full production smoke matrix consolidating WR02–WR07 manual sign-offs; deliver PR-WR08.md and close the sprint."
todos:
  - id: baseline-gate
    content: Run full merge gate; record 206/11/17 baseline in PR-WR08.md §2
    status: completed
  - id: audit-pwa-privacy
    content: Execute PWA + privacy audit checklist; log findings P0–P3
    status: completed
  - id: audit-security-env-api
    content: Audit firestore/storage rules, .env.local.example, analyze-meal + session routes, user-data-deletion
    status: completed
  - id: fix-p0-p1
    content: Fix all audit P0/P1 findings before proceeding
    status: completed
  - id: fix-storage-orphan
    content: "WR08-STOR-01: compensating Storage delete in use-log-meal.ts + unit test"
    status: completed
  - id: fix-rules-tests
    content: "WR08-RULE-01/02: cross-user deny tests for meals + weighIns integration"
    status: completed
  - id: fix-privacy-env
    content: WR08-PRIV-01 session cookie copy + WR08-ENV-01 example comments if gaps confirmed
    status: completed
  - id: rate-limit-docs
    content: "WR08-RATE-01: Document abuse notes in PR-WR08 §7 — no rate-limit code (locked)"
    status: completed
  - id: prod-smoke
    content: Execute ROLLOUT 4.7 + 5.5 production smoke on live Vercel; fill PR-WR08.md §8 sign-off table
    status: completed
  - id: docs-deliverables
    content: Complete PR-WR08.md + pr_wr08_*.plan.md; update README WR index; sprint completion sign-off
    status: completed
  - id: final-gate
    content: Final merge gate green; verify 17 E2E unchanged; document after counts
    status: completed
isProject: false
---

# WR08: Production, PWA & Security Hardening

**Canonical plan:** [`.cursor/plans/pr_wr08_production_pwa_security.plan.md`](pr_wr08_production_pwa_security.plan.md)  
**Depends on:** [PR-WR07.md](../../docs/implementation/web/PR-WR07.md) — merge gate **206 unit / 11 integration / 17 E2E (9 specs)**  
**Reviews:** [PR-W10.md](../../docs/implementation/web/PR-W10.md) + [REVIEW-MASTER-PLAN.md](../../docs/implementation/web/REVIEW-MASTER-PLAN.md) WR08 + [ROLLOUT.md](../../docs/implementation/web/ROLLOUT.md) Phases 4–5

---

## Sharpened decisions (resolved)

| # | Question | **Resolved answer** |
|---|----------|---------------------|
| 1 | Rate limiting (`WR03-SCAN-04`) | **Document-only (locked).** No rate-limit code. `PR-WR08.md` §7 abuse notes: session-gated routes block anonymous Gemini abuse; per-uid cost exposure is operator risk; P3 residual. No Redis/Upstash. |
| 2 | Storage orphan on log fail (`WR03-SCAN-02`) | **Implement P2 fix** in [`use-log-meal.ts`](../../calsnap-web/lib/queries/use-log-meal.ts): `try/catch` around `createMeal`; on failure, `deleteObject` uploaded `photoStoragePath` (best-effort). Unit test with mocked repo. |
| 3 | Delete-all Storage `console.warn` (`WR06-SET-08`) | **Defer P3** — prefix wipe + per-meal delete already best-effort; document in residual risks unless audit finds user-visible data-loss P1. |
| 4 | Firestore negative rule tests | **Add P2** cross-user deny cases to existing integration tests — mirror `profile-firestore.test.ts`. No new test file. |
| 5 | Privacy session cookie gap | **Fix P2 if confirmed** — session cookie paragraph in `lib/copy/privacy.ts`. |
| 6 | PWA maskable icons | **Defer P3** unless Android Lighthouse installability fails. |
| 7 | New E2E specs | **None merge-blocking** unless audit finds P0/P1 gap. Keep **17 E2E green**. |
| 8 | Lighthouse scores | **Fix P0/P1 a11y only (locked)**; record all scores even if below targets. Not CI-gated. |
| 9 | Production smoke environment | **Live Vercel production URL** for Google OAuth + PWA. Email on preview OK. |
| 10 | Rules deploy verification | Operator checklist in PR-WR08 §8. |
| 11 | Real Gemini in CI | **Never** — manual production only. |
| 12 | Sprint close-out | Update README WR index when §8 signed off. |
| 13 | Gemini 503 on production | **Unit test + route audit only (locked).** Do not unset prod key. |
| 14 | Production smoke depth | **Full 20-scenario matrix (locked).** |

**No open sharpen questions remain** (second sharpen pass 2026-06-30).

---

See full phase checklists, fix list, smoke matrix, and deliverables in the synced plan at [wr08_production_pwa_security_7eadeaf9.plan.md](wr08_production_pwa_security_7eadeaf9.plan.md) — keep both files in sync during implementation.
