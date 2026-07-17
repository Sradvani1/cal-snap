# PR WR07: Mobile UX, Accessibility & Performance

**Status:** Implemented  
**Sprint:** Post-build review WR07 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md))  
**Depends on:** [PR-WR06.md](./PR-WR06.md) (10 E2E / 8 specs green)  
**Reviews:** [PR-W09.md](./PR-W09.md) design system + cross-cutting polish

---

## 1. Audit checklist

### 1.1 Mobile layout (320px)

| Route | Horizontal scroll | Notes |
|-------|-------------------|-------|
| `/login` | Pass | E2E `viewport-320.spec.ts` |
| `/signup` | Pass | Spot-check; same auth shell as login |
| `/onboarding` | Pass | E2E |
| `/dashboard` | Pass | E2E; calorie ring `min-w-0` |
| `/scan` | Pass | E2E best-effort |
| `/log`, `/log/[mealId]` | Pass | Manual spot-check; row actions `min-h-11` |
| `/progress` | Pass | E2E best-effort |
| `/analytics` | Pass | E2E best-effort; picker `flex-wrap`, chart `min-w-0` |
| `/settings` | Pass | E2E; fixed save bar `bottom-16` above tab nav |
| `/privacy` | Pass | Spot-check readable at 320px |

### 1.2 Touch targets (≥44px)

| Control | Result |
|---------|--------|
| Tab bar links (`min-h-11`) | Pass |
| Scan FAB (`h-14`) | Pass |
| Primary buttons (`min-h-11`) | Pass |
| Meal log ⋯ menu (`min-h-11 min-w-11`) | Pass |
| Analytics timeframe buttons (`min-h-11`) | Pass |

### 1.3 Dark mode readability

| Surface | Result |
|---------|--------|
| CSS tokens (`globals.css`) | Pass |
| Recharts axis/reference lines (5 surfaces) | **Fixed** — `useChartColors()` |
| Calorie ring (CSS tokens) | Pass — unit test green |

### 1.4 Focus indicators

| Surface | Result |
|---------|--------|
| Buttons (`focus-visible:ring`) | Pass |
| Form inputs (`formFieldInputClassName`) | **Fixed** |
| Auth login/signup inputs | **Fixed** |
| Analytics timeframe picker | **Fixed** |
| Meal type selector (scan) | **Fixed** |
| Tab bar links | **Fixed** |

### 1.5 Reduced motion

| Consumer | Result |
|----------|--------|
| CalorieRingView | Pass (existing) |
| MealAnalysisResultView stagger | Pass (existing) |
| WeightProgressChart | Pass (existing) |
| Analytics BarCharts (4 sections) | **Fixed** — `isAnimationActive={!reducedMotion}` |

### 1.6 Copy audit

| Area | Result |
|------|--------|
| `app/api/*` error strings | **Fixed** — `lib/copy/api.ts` + `lib/api/error-codes.ts` |
| `use-meal-scanner` parse coupling | **Fixed** — branches on `body.code` |
| `use-generate-insight.ts` | Pass — already uses `copy()` for client errors |
| `app/` + `components/` grep | Pass — no new user-facing literals found |

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

**Note:** Firebase emulators require Java 21+ (`JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` on macOS Homebrew).

### Initial baseline (2026-06-30, before WR07 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass (after `JAVA_HOME`) | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **10** tests (8 spec files) |

### Final merge gate (2026-06-30, after WR07 fixes + review follow-up)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **206** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **17** tests in **9** spec files |

**E2E delta:** +7 tests, +1 spec file (`viewport-320.spec.ts`). WR06 specs (settings save, delete-all, analytics, etc.) all still pass.

**Unit delta:** +5 tests (API copy keys, session error shape, parse-failed route, invalid JSON session).

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR07-E2E-01 | P1 | E2E | No 320px viewport tests | **Fixed** — `viewport-320.spec.ts` |
| WR07-COPY-01 | P2 | API | 22+ hardcoded API error strings | **Fixed** — `lib/copy/api.ts` |
| WR07-COPY-02 | P2 | Session | Raw `error.message` in session route | **Fixed** |
| WR07-LAY-01 | P2 | Charts | Recharts used `lightColors` in dark mode | **Fixed** — `useChartColors()` |
| WR07-A11Y-01 | P2 | Forms | Inputs lacked `focus-visible` ring | **Fixed** — `form-field.ts` + auth |
| WR07-A11Y-02 | P2 | Controls | Meal-type selector + tab links lacked focus ring | **Fixed** — review follow-up |
| WR07-COPY-03 | P2 | Session | Malformed JSON mapped to 401; broad `missing` → 503 | **Fixed** — invalid JSON → 400; credential-only 503 |
| WR07-MOT-01 | P3 | Motion | Analytics charts ignored reduced motion | **Fixed** |
| WR07-PERF-01 | P3 | Bundle | Eager Recharts + html2canvas | **Fixed** — dynamic import |

**Open P0/P1:** None.

---

## 4. Mobile Lighthouse baseline (document only)

**Environment:** Local production build — `pnpm build && pnpm start` with Firebase emulators; logged-in onboarded session in Chrome incognito. Mobile preset, throttling on.

| Page | Perf | A11y | Best Practices | SEO | Date | Notes |
|------|------|------|----------------|-----|------|-------|
| `/dashboard` | Pending | Pending | Pending | Pending | 2026-06-30 | Capture in manual §8 |
| `/scan` | Pending | Pending | Pending | Pending | 2026-06-30 | Capture in manual §8 |
| `/settings` | Pending | Pending | Pending | Pending | 2026-06-30 | Capture in manual §8 |

**Policy:** Lighthouse scores are not merge-blocking. All reported a11y failures must be fixed before sign-off; chart dark-mode and focus-ring fixes address the known pre-audit gaps.

**Informative targets:** Perf ≥70, A11y ≥90 per page.

---

## 5. Fix list

| File | Change | Why |
|------|--------|-----|
| `lib/copy/api.ts` (new) | API error copy keys | WR07-COPY-01 |
| `lib/api/error-codes.ts` (new) | Stable `code` union | Client branching |
| `app/api/analyze-meal/route.ts` | `{ error, code }` via `copy()` | WR03-COPY-01 |
| `app/api/generate-insight/route.ts` | Same | WR01-COPY-02 |
| `app/api/auth/session/route.ts` | `{ error, code }`; invalid JSON → 400; credential-only 503 | WR07-COPY-02/03 |
| `lib/copy/api.ts` | Added `api.session.invalidJson` | WR07-COPY-03 |
| `components/scanner/MealTypeSelector.tsx` | Focus ring on meal-type chips | WR07-A11Y-02 |
| `components/app/BottomTabNav.tsx` | Focus ring on tab links | WR07-A11Y-02 |
| `tests/unit/analyze-meal-route.test.ts` | `analysis_parse_failed` on 502 | Contract regression |
| `tests/unit/session-route.test.ts` | Invalid JSON → 400 | WR07-COPY-03 |
| `lib/scanner/use-meal-scanner.ts` | Branch on `ApiErrorCode.AnalysisParseFailed` | Decouple from English string |
| `lib/design/use-chart-colors.ts` (new) | `useSyncExternalStore` dark/light palette | WR07-LAY-01 |
| `lib/design/form-field.ts` | `focus-visible` ring | WR07-A11Y-01 |
| `app/(auth)/login/page.tsx`, `signup/page.tsx` | Auth input focus rings | WR07-A11Y-01 |
| `components/analytics/*Section.tsx` (4) | Chart colors + reduced motion | WR07-LAY-01, WR07-MOT-01 |
| `components/progress/WeightProgressChart.tsx` | `useChartColors()` | WR07-LAY-01 |
| `components/analytics/AnalyticsTimeframePicker.tsx` | Focus ring on buttons | WR07-A11Y-01 |
| `app/(app)/analytics/page.tsx` | `next/dynamic` chart sections | WR07-PERF-01 |
| `components/meal-log/use-meal-share-image.ts` | Dynamic `html2canvas` import | WR07-PERF-01 |
| `tests/e2e/helpers/viewport.ts` (new) | 320px helpers | WR07-E2E-01 |
| `tests/e2e/viewport-320.spec.ts` (new) | 4 merge-blocking + 3 best-effort | WR07-E2E-01 |

---

## 6. E2E: 320px viewport spec

### Merge-blocking (4 tests)

| Test | Route | Assert |
|------|-------|--------|
| Login | `/login` | No horizontal scroll; login title |
| Onboarding | `/onboarding` | No horizontal scroll |
| Dashboard | `/dashboard` | No horizontal scroll; calorie ring |
| Settings | `/settings` | No horizontal scroll; settings title |

### Best-effort (3 tests — all pass in CI)

| Test | Route |
|------|-------|
| Scan | `/scan` |
| Progress | `/progress` |
| Analytics | `/analytics` |

### Helper contract (`viewport.ts`)

| Export | Purpose |
|--------|---------|
| `MOBILE_VIEWPORT` | `{ width: 320, height: 568 }` |
| `setMobileViewport(page)` | Apply viewport |
| `assertNoHorizontalScroll(page)` | `scrollWidth <= clientWidth + 1` |
| `assertRouteReady(page, heading)` | Heading visible |

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| Lighthouse scores not captured in CI | Manual §8 sign-off; document-only per master plan |
| 200% zoom on secondary routes | Manual doc-only; primary flows spot-checked |
| Keyboard matrix | Manual sign-off; no full E2E matrix |
| ESLint copy guard rule | P3 — defer to future PR |
| `button` `sm` (36px) on desktop-only surfaces | Accept unless mobile-visible |
| Settings save bar only when `isDirty` | Viewport test asserts title, not save CTA |
| Delete-all Storage warnings | WR08 defer P3 (PR-WR08 §7) |
| Reminder prefs vs banner | WR04 residual (unchanged) |

---

## 8. Manual sign-off

| Scenario | Environment | Signed off |
|----------|-------------|------------|
| Light + dark all tabs | Local browser | Pending |
| 320px + 200% zoom primary flows (auth, onboarding, dashboard, settings, scan) | DevTools | Pending |
| Keyboard matrix (login, onboarding, settings, weigh-in sheet, manual meal) | Local | Pending |
| Mobile Lighthouse ×3 (dashboard, scan, settings) | Chrome Lighthouse Mobile | Pending |
| Reduced motion OS setting — scan stagger + chart animations off | Local | Pending |

**Not in WR07:** CSV export download, delete-all Storage warnings, PWA install, production Google OAuth, WR06 settings/delete E2E re-audit.

---

## 9. Acceptance criteria

- [x] Merge gate green before and after; E2E 10 → 17, unit 201 → 206 documented
- [x] Zero open **P0/P1** in WR07 scope
- [x] 320px E2E merge-blocking: login, onboarding, dashboard, settings
- [x] Copy: no user-facing literals in `app/api/`; `app/` + `components/` verified
- [x] `calorie-ring-accessibility.test.ts` still passes
- [x] WR06 flows untouched (settings save, delete-all E2E still pass)
- [x] `PR-WR07.md` complete with checklist, findings, Lighthouse table, residual risks
- [x] No real Gemini in CI
- [ ] Mobile Lighthouse §4 scores + §8 manual sign-off (document-only; pending operator capture)

---

## 10. Files changed index

**New**

- `lib/copy/api.ts`
- `lib/api/error-codes.ts`
- `lib/design/use-chart-colors.ts`
- `tests/e2e/helpers/viewport.ts`
- `tests/e2e/viewport-320.spec.ts`
- `docs/implementation/web/PR-WR07.md`

**Modified**

- `lib/copy/keys.ts`
- `lib/design/form-field.ts`
- `app/api/analyze-meal/route.ts`
- `app/api/generate-insight/route.ts`
- `app/api/auth/session/route.ts`
- `lib/scanner/use-meal-scanner.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `components/analytics/CalorieAdherenceSection.tsx`
- `components/analytics/MacroTrendsSection.tsx`
- `components/analytics/FiberSection.tsx`
- `components/analytics/PatternsSection.tsx`
- `components/analytics/AnalyticsTimeframePicker.tsx`
- `components/scanner/MealTypeSelector.tsx`
- `components/app/BottomTabNav.tsx`
- `components/progress/WeightProgressChart.tsx`
- `app/(app)/analytics/page.tsx`
- `components/meal-log/use-meal-share-image.ts`
- `tests/e2e/helpers/index.ts`
- `tests/unit/copy.test.ts`
- `tests/unit/session-route.test.ts`
- `tests/unit/analyze-meal-route.test.ts`
- `tests/unit/generate-insight-route.test.ts`
- `docs/implementation/web/README.md`
