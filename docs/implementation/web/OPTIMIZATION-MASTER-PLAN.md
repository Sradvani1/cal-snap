# CalSnap Web — Frontend Optimization Sprint (WO01–WO05)

Native-feel polish for the installable PWA on mobile Safari/Chrome — safe areas, launch chrome, app shell, loading UX, keyboard/forms, and performance baseline.

**Build sprint index:** [README.md](./README.md) · **Review sprint:** [REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md) · **Cursor plan:** [.cursor/plans/web_optimization_sprint_68cb0f71.plan.md](../../.cursor/plans/web_optimization_sprint_68cb0f71.plan.md)

---

## Purpose

**In scope:** UI/UX polish for the current feature set; PWA install/launch improvements that do not add offline meal logging or cached authenticated pages.

**Out of scope (locked):** Web Push/FCM, offline meal logging, swipe-to-delete, settings appearance toggle, 3-tab IA redesign, USDA fallback, historical meal log, HealthKit, per-uid Gemini rate limiting, new routes/features.

**IA decision (locked):** Keep the existing **5-tab bar** (Dashboard, Log, Scan, Progress, Settings).

---

## Sharpened decisions (locked 2026-07-01)

| Decision | Choice |
|----------|--------|
| View Transitions | Defer entirely |
| iOS splash scope | Minimal — 2 common iPhone sizes + dark variants |
| Input 16px (iOS zoom) | All form inputs on mobile (`text-base sm:text-sm`) — WO05 |
| Query tuning | Conservative — `refetchOnWindowFocus: false` globally — WO05 |
| Overscroll rubber-band | Disable in standalone/PWA only — WO03 |
| PageHeader / large titles | Defer |
| Manual QA sprint gate | Document Pending rows; code-complete without operator block |

---

## Sprint progress

| PR | Doc | Status | Merge commit |
|----|-----|--------|--------------|
| WO01 | [PR-WO01.md](./PR-WO01.md) | **Complete** — merged | `4ea0500` |
| WO02 | [PR-WO02.md](./PR-WO02.md) | **Complete** — merged | `c2ab40f` |
| WO03 | [PR-WO03.md](./PR-WO03.md) | **Complete** — merged | `6e1a511` |
| WO04 | — | Pending | — |
| WO05 | — | Pending | — |

---

## Dependency graph

```
WO01 → WO02 → WO03 → WO04 → WO05
```

WO01 is the foundation — all fixed-position chrome depends on shared safe-area tokens.

---

## Merge gate

```bash
cd calsnap-web
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

---

## WO summaries

### WO01 — Native Shell & Safe Areas ✅

Safe-area tokens, `viewport-fit: cover`, dual themeColor, all app routes on `layout.pageShell` + `layout.content.bottomPadding`, tab bar / FAB / settings save bar / sheet padding.

### WO02 — PWA Launch & Install Polish ✅

Maskable icon, iOS splash screens, `generate:pwa-assets` script, manifest polish, install banner fade. SW unchanged.

### WO03 — App Chrome, Tab Bar & Sheets ✅

Translucent tab bar blur, iOS-style bottom sheets (drag handle, slide-up motion, reduced motion, softer overlay), ScanFab elevation token, standalone-only overscroll disable. View Transitions deferred.

### WO04 — Loading States & Auth Bootstrap

`AppShellSkeleton` (content-only, no phantom tab bar), auth/onboarding/settings skeleton gates. **Depends on WO03.**

### WO05 — Forms, Keyboard & Performance Sign-off

16px inputs, keyboard inset hook, query tuning, `PERF-BASELINE.md`, WR07/WR08 manual QA closure. **Depends on WO01–WO04.**

---

## Sprint success criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | iOS standalone: no safe-area clipping on tab bar, FAB, save bar, sheet CTAs | WO01 ✅ code; §8 manual Pending |
| 2 | PWA install verified iOS + Android | WO02 §8 Pending |
| 3 | No plain-text loading gates on app/auth/onboarding | WO04 |
| 4 | Tab bar blur; sheets drag handle + safe-area footers | WO03 ✅ |
| 5 | Lighthouse baseline; zero P0/P1 a11y failures | WO05 |
| 6 | CI merge gate green; E2E intact | WO01–03 lint/unit/build ✅ |
| 7 | Each `PR-WO0N.md` findings matrix + residual risks | WO01–03 ✅ |
| 8 | Deferred product features unimplemented | ✅ |

---

## Residual risks (sprint-wide)

| Risk | PR | Notes |
|------|-----|-------|
| Swipe-to-dismiss sheets | WO03 | Drag handle decorative only — closed in [PR-WO03.md](./PR-WO03.md) |
| View Transitions | Post-sprint | Unsaved-work guard on `/scan` |
| PageHeader / large titles | Post-sprint | Per-tab layout churn |
| Playwright safe-area / standalone overscroll | WO01/WO03 | Real-device manual sign-off required |
| Local E2E emulator flakiness | All | Port contention; CI authoritative |

---

## Documentation index

| Artifact | Path |
|----------|------|
| Master plan | This file |
| Per-PR spec | `PR-WO01.md` … `PR-WO05.md` |
| Performance baseline | `PERF-BASELINE.md` (WO05) |
