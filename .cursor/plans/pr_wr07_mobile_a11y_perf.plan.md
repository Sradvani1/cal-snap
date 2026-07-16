---
name: WR07 Mobile A11y Perf
overview: Cross-cutting WR07 audit and fix pass for 320px layout, accessibility, copy centralization (API routes + deferred WR01/WR03 items), reduced motion, dark-mode chart tokens, opportunistic bundle splits, merge-blocking 320px Playwright specs, and document-only Mobile Lighthouse baselines — without re-auditing WR06-stable settings/delete flows.
todos:
  - id: baseline-gate
    content: Run full merge gate; record baseline counts in PR-WR07.md §2
    status: completed
  - id: route-audit
    content: Execute 13-route audit matrix (320px, focus, touch, dark, motion); run Mobile Lighthouse on dashboard/scan/settings
    status: completed
  - id: fix-a11y-layout
    content: "Fix P0/P1 + Lighthouse a11y failures: chart dark colors, input focus-visible, any horizontal scroll"
    status: completed
  - id: copy-api-sweep
    content: Add lib/copy/api.ts + error codes; migrate 3 API routes; update use-meal-scanner coupling; grep app/components
    status: completed
  - id: perf-lazy
    content: Dynamic import analytics chart sections + html2canvas in share hook
    status: completed
  - id: reduced-motion
    content: Gate analytics Recharts isAnimationActive with useReducedMotion
    status: completed
  - id: e2e-viewport
    content: Add viewport.ts helper + viewport-320.spec.ts — 4 merge-blocking routes; scan/progress/analytics best-effort
    status: completed
  - id: docs-deliverables
    content: Complete PR-WR07.md (findings, Lighthouse table, manual §8) + pr_wr07_*.plan.md + README status
    status: completed
  - id: final-gate
    content: Final merge gate; verify WR06 E2E still pass; document E2E delta
    status: completed
isProject: false
---

# WR07: Mobile UX, Accessibility & Performance

**Canonical plan:** [.cursor/plans/pr_wr07_mobile_a11y_perf.plan.md](pr_wr07_mobile_a11y_perf.plan.md) (this file)  
**Depends on:** [PR-WR06.md](../../docs/implementation/web/PR-WR06.md) (10 E2E / 8 specs green)  
**Reviews:** [PR-W09.md](../../docs/implementation/web/PR-W09.md) + [REVIEW-MASTER-PLAN.md](../../docs/implementation/web/REVIEW-MASTER-PLAN.md) WR07

---

## Sharpened decisions (resolved)

| # | Question | **Resolved answer** |
|---|----------|---------------------|
| 1 | API error contract | **Stable machine `code` + localized `error` from `copy()`** — routes return `{ error, code }`; clients branch on `code` |
| 2 | Recharts dark mode | **`useChartColors()`** via `useSyncExternalStore` — swap `lightColors` / `darkColors` in 5 chart surfaces |
| 3 | 320px E2E merge-blocking | **4 routes:** `/login`, `/onboarding`, `/dashboard`, `/settings`. Scan/progress/analytics best-effort only |
| 4 | Lighthouse environment | **Local `pnpm build && pnpm start`** + emulators + logged-in session |
| 5 | 200% zoom failures | **Fix P2 on primary flows** (auth, onboarding, dashboard, settings, scan); else document |
| 6 | Bundle lazy-load scope | **Analytics `next/dynamic` + html2canvas on-demand only** |

**No open sharpen questions remain.**

---

See full checklist, E2E contract, findings matrix, and acceptance criteria in the synced plan body at [.cursor/plans/wr07_mobile_a11y_perf_65e5cdda.plan.md](wr07_mobile_a11y_perf_65e5cdda.plan.md) — keep both files in sync during implementation.
