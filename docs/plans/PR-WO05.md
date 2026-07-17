# PR WO05: Forms, Keyboard & Performance Sign-off

**Status:** Complete — lint/unit/build green (232 tests). **Settings floating save bar superseded** by header Save in [PR-IPHONE-SAFARI-UX.md](./PR-IPHONE-SAFARI-UX.md). Integration/E2E pending clean emulator env or CI (§2). Lighthouse scores pending Vercel preview capture (§6). §8 manual sign-off Pending (operator).  
**Sprint:** Optimization WO05 ([OPTIMIZATION-MASTER-PLAN.md](./OPTIMIZATION-MASTER-PLAN.md))  
**Depends on:** WO01 (`4ea0500`) + WO02 (`c2ab40f`) + WO03 (`6e1a511`) + WO04 merged to `main`  
**Plan:** [.cursor/plans/pr_wo05_forms_keyboard_perf.plan.md](../../.cursor/plans/pr_wo05_forms_keyboard_perf.plan.md)

---

## Sharpened decisions (locked 2026-07-01)

| # | Decision | Resolved |
|---|----------|----------|
| 1 | Mobile input font size | `text-base sm:text-sm` on all visible text/number/date/textarea/select controls |
| 2 | Central token | `formFieldInputClassName` in `form-field.ts`; migrate inline duplicates |
| 3 | Query tuning | `refetchOnWindowFocus: false` globally; keep `staleTime: 30_000` |
| 4 | Keyboard hook location | `lib/hooks/use-keyboard-inset.ts` — `useSyncExternalStore` + `visualViewport` |
| 5 | Keyboard integration | Consumer-level padding + `scrollIntoView` — **not** global `AppDialog` change |
| 6 | Keyboard consumers | WeighInSheet, FoodItemEditSheet, ManualMealEntryView, onboarding page, settings page |
| 7 | Lighthouse policy | Fix all a11y audit failures; numeric targets informative only (WR07 §4) |
| 8 | Manual QA | WR07 §8 + WR08 §8 rows **Pending** in §8 — non-blocking for merge |
| 9 | E2E delta | **0** new specs |
| 10 | ESLint copy guard | P3 defer |
| 11 | Sprint docs | `OPTIMIZATION-MASTER-PLAN.md` + README WO05 → Complete |
| 12 | Keyboard inset layer | Consumer-only — `AppDialog` unchanged |
| 13 | Settings page keyboard | Include — scroll container + save bar `bottom` bump |
| 14 | Lighthouse environment | Vercel preview HTTPS |
| 15 | Inline input migration | Import `formFieldInputClassName` on every inline surface |
| 16 | Keyboard E2E | Skip entirely |
| 17 | Auth page 16px token | Import `formFieldInputClassName` directly — no local duplicate |
| 18 | Settings save bar + keyboard | Bump fixed save bar `bottom` by `keyboardInset` when keyboard open |
| 19 | Focus scroll helper | Export `scrollFormFieldIntoView(event)` from `use-keyboard-inset.ts` |
| 20 | Manual meal numeric fields | Keep raw `<input type="number">` — `inputMode` + token only |
| 21 | Lighthouse a11y boundary | Audit 3 routes only: `/dashboard`, `/scan`, `/settings` |
| 22 | Query client unit test | `tests/unit/query-client.test.ts` |

---

## 1. Audit checklist

| Scope item | Pre-audit | Post-fix |
|------------|-----------|----------|
| iOS zoom risk (`text-sm` on inputs) | Fail — `form-field.ts` + 8 inline surfaces + auth duplicates | **Pass** — `text-base sm:text-sm`; grep gate clean |
| No keyboard inset | Fail — zero `visualViewport` usage | **Pass** — `useKeyboardInset()` + 5 consumers |
| Tab-switch refetch | Fail — `refetchOnWindowFocus: true` | **Pass** — `false`; unit test guards regression |
| Lighthouse baseline | Pending (WR07 §4) | **Pass (code)** — a11y fixes applied; scores in [PERF-BASELINE.md](./PERF-BASELINE.md) |
| `inputMode` gaps | Fail — manual meal, food edit sheet | **Pass** — audit table complete |
| `AppDialog` global keyboard | N/A — explicitly out of scope | **Pass** — unchanged |
| AnalyticsCustomRangeSheet keyboard | Deferred | **Pass** — date-only sheet; residual risk documented |

**Input audit grep** (from `calsnap-web/`):

```bash
rg 'text-sm' --glob '*.{tsx,ts}' | rg 'input|textarea|select|formField'
```

**Post-fix result:** 0 hits on form control class strings (2026-07-01).

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

> **Note:** Integration/E2E require Java 21+ and free emulator ports (`JAVA_HOME=/opt/homebrew/opt/openjdk@21` on macOS Homebrew).

### Initial baseline (before WO05, post-WO04)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **222** tests (40 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass (CI) | **11** tests (5 files) |
| `pnpm test:e2e` | Pass (CI) | **18** tests |

### Final merge gate (after WO05 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **232** tests (43 files) — **+10** |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | **Blocked locally** | Port 8080 contention / Java path |
| `pnpm test:e2e` | **Blocked locally** | Web server start failure in env |

**Unit delta:** +10 tests (`form-field.test.ts`, `use-keyboard-inset.test.ts`, `query-client.test.ts`).  
**E2E delta:** 0 new specs; 18 existing unchanged.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WO05-FORM-01 | **P1** | Forms | `form-field.ts` used `text-sm` (14px) — iOS zoom risk | **Fixed** — `text-base sm:text-sm` |
| WO05-FORM-02 | **P1** | Forms | 8 inline input surfaces duplicated token strings | **Fixed** — import `formFieldInputClassName` |
| WO05-FORM-03 | P2 | Auth | Local `inputClassName` duplicate on login/signup | **Fixed** — direct token import |
| WO05-KB-01 | **P1** | Keyboard | No `visualViewport` keyboard inset hook | **Fixed** — `use-keyboard-inset.ts` |
| WO05-KB-02 | **P1** | Keyboard | Sheets/forms lack inset padding on focus | **Fixed** — 5 consumers |
| WO05-KB-03 | P2 | Settings | Fixed save bar occluded by keyboard at 320px | **Fixed** — `bottom` += `keyboardInset` |
| WO05-QUERY-01 | P2 | Perf | `refetchOnWindowFocus: true` caused tab-switch refetch | **Fixed** — `false` globally |
| WO05-A11Y-01 | P2 | A11y | Warning/danger text contrast on light surfaces | **Fixed** — `--cs-warning-text` / `--cs-danger-text` |
| WO05-A11Y-02 | P2 | A11y | Metric height input unlabeled (settings) | **Fixed** — `HeightInputFields.tsx` |
| WO05-A11Y-03 | P2 | A11y | Missing focus rings on weigh-in weight, range sliders, raw buttons | **Fixed** |
| WO05-A11Y-04 | P2 | A11y | Meal type selector lacks radio semantics | **Fixed** — `role="radiogroup"` |
| WO05-A11Y-05 | P2 | A11y | Scan stagger: focusable while `opacity-0` | **Fixed** — `inert` until visible |
| WO05-INPUT-01 | P2 | Forms | Manual meal / food edit missing `inputMode` | **Fixed** — audit table |
| WO05-A11Y-06 | P2 | A11y | Post-review: calorie ring, deficit slider, dark tokens, onboarding padding | **Fixed** — see PERF-BASELINE A11Y-14–20 |
| WO05-DEFER-02 | P3 | Copy | ESLint copy guard | Deferred — WR07 P3 carryover |

**Open P0/P1:** None in WO05 scope.

---

## 4. Fix list

| File | Change | Why |
|------|--------|-----|
| `lib/design/form-field.ts` | `text-base sm:text-sm` | WO05-FORM-01 |
| `lib/hooks/use-keyboard-inset.ts` (new) | `useKeyboardInset`, `scrollFormFieldIntoView`, `computeKeyboardInset` | WO05-KB-01 |
| `lib/queries/query-client.ts` | `refetchOnWindowFocus: false` | WO05-QUERY-01 |
| `app/(auth)/login/page.tsx`, `signup/page.tsx` | `formFieldInputClassName`; `inputMode`/`enterKeyHint` | WO05-FORM-03 |
| `components/scanner/ManualMealEntryView.tsx` | Token + keyboard inset + `inputMode` | WO05-FORM-02, WO05-KB-02 |
| `components/scanner/FoodItemEditSheet.tsx` | Token + keyboard inset | WO05-FORM-02, WO05-KB-02 |
| `components/progress/WeighInSheet.tsx` | Token + keyboard + focus + `aria-pressed` | WO05-KB-02, WO05-A11Y-03 |
| `components/analytics/AnalyticsCustomRangeSheet.tsx` | Token only (16px) | WO05-FORM-02 |
| `components/scanner/MealScannerCaptureView.tsx` | Token on textarea | WO05-FORM-02 |
| `app/(onboarding)/onboarding/page.tsx` | Keyboard inset on scroll shell | WO05-KB-02 |
| `app/(app)/settings/page.tsx` | Keyboard inset + save bar bump | WO05-KB-03 |
| `app/globals.css` | `--cs-warning-text`, `--cs-danger-text` | WO05-A11Y-01 |
| `lib/design/colors.ts` | Badge text tokens | WO05-A11Y-01 |
| `components/design/CalorieRingView.tsx` | Band label contrast tokens | WO05-A11Y-06 |
| `components/onboarding/DeficitSlider.tsx` | Range input focus ring | WO05-A11Y-06 |
| `components/design/HeightInputFields.tsx` | Metric label + toggle focus ring | WO05-A11Y-02, WO05-A11Y-06 |
| `components/scanner/MealTypeSelector.tsx` | Radiogroup semantics | WO05-A11Y-04 |
| `components/scanner/MealAnalysisResultView.tsx` | Stagger `inert` + contrast | WO05-A11Y-05 |
| `components/scanner/MealScannerAnalyzingView.tsx` | `aria-live` status | WO05-A11Y |
| `components/design/InlineErrorMessage.tsx` | `role="alert"` + contrast | WO05-A11Y |
| `components/meal-log/MealListSection.tsx` | Persistent link underline | WO05-A11Y |
| `tests/unit/form-field.test.ts` (new) | Token class assertions | Merge-blocking |
| `tests/unit/use-keyboard-inset.test.ts` (new) | Hook + scroll helper tests | Merge-blocking |
| `tests/unit/query-client.test.ts` (new) | Default options regression | Merge-blocking |
| `docs/plans/PERF-BASELINE.md` (new) | Lighthouse baseline doc | WO05 deliverable |
| `docs/plans/OPTIMIZATION-MASTER-PLAN.md` (new) | Sprint close-out | WO05 deliverable |

---

## 5. Design contract

### `useKeyboardInset` API

```ts
/** Pixels of virtual keyboard overlapping the layout viewport bottom. 0 when closed or unsupported. */
export function useKeyboardInset(): number

/** Scroll focused form control into view; respects prefers-reduced-motion. */
export function scrollFormFieldIntoView(event: FocusEvent<HTMLElement>): void
```

- `useSyncExternalStore` + `visualViewport` `resize`/`scroll` (pattern: `motion.ts`)
- SSR / no `visualViewport`: snapshot `0`
- Consumer-only integration — `AppDialog` unchanged

### Form field class

```ts
export const formFieldInputClassName = [
  '... px-3 py-2 text-base sm:text-sm text-cs-foreground',
  formFieldFocusRingClassName,
].join(' ');
```

### Query client defaults

```ts
staleTime: 30_000,
refetchOnWindowFocus: false,
```

---

## 6. Tests

### Unit (merge-blocking)

| File | Tests |
|------|-------|
| `tests/unit/form-field.test.ts` | `text-base` + `sm:text-sm`; focus ring present |
| `tests/unit/use-keyboard-inset.test.ts` | Closed → 0; resized → positive; SSR → 0; unsubscribe; `scrollFormFieldIntoView` behavior |
| `tests/unit/query-client.test.ts` | `refetchOnWindowFocus: false`; `staleTime: 30_000` |

**Count:** 222 → **232** (+10).

### E2E

**No new specs.** All 18 existing must stay green.

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| ESLint copy guard | P3 carryover from WR07 — not in WO05 scope |
| Android keyboard / visualViewport variance | Best-effort; iOS primary |
| Playwright keyboard E2E | Skipped by design — manual §8 required |
| Dashboard double skeleton LCP | WO04 accepted; verify in Lighthouse doc |
| `AnalyticsCustomRangeSheet` keyboard | Deferred — date picker sheet; lower traffic |
| Preview vs prod Lighthouse delta | Scores may differ; operator may re-run on prod per WR08 §8 |
| Local emulator port contention | Blocks integration/E2E locally; CI expected green |

---

## 8. Manual sign-off

### A. WR07 carryover ([PR-WR07.md](./PR-WR07.md) §8)

| Scenario | Environment | Signed off |
|----------|-------------|------------|
| Light + dark all tabs | Local browser | Pending |
| 320px + 200% zoom primary flows | DevTools | Pending |
| Keyboard matrix (login, onboarding, settings, weigh-in, manual meal) | Local / device | Pending |
| Mobile Lighthouse ×3 | Chrome Mobile | Pending |
| Reduced motion — scan stagger + charts | Local | Pending |

### B. WR08 carryover ([PR-WR08.md](./PR-WR08.md) §8)

Reference full matrix rows 1–20 + pre-flight; all **Pending** except row 12 (CI Done) and rules deploy Done.

### C. WO05-specific

| Scenario | Environment | Pass criteria | Signed off |
|----------|-------------|---------------|------------|
| iOS Safari input zoom | iPhone Safari 320px | No page zoom on settings/onboarding numeric focus | Pending |
| Settings keyboard | iPhone Safari 320px | Lower profile fields visible; header Save reachable (floating bar superseded — [PR-IPHONE-SAFARI-UX.md](./PR-IPHONE-SAFARI-UX.md)) | Pending |
| Weigh-in keyboard | iPhone standalone | Weight input visible; save CTA reachable | Pending |
| Tab switch no spinner | iOS PWA | Dashboard ↔ Log ↔ Settings within 30s — no refetch flash | Pending |

### D. Optimization sprint completion

| Criterion | Status |
|-----------|--------|
| Safe-area / PWA / chrome / skeleton (WO01–04) | Done (code) |
| 16px inputs + keyboard hook (WO05) | Done (code) |
| PERF-BASELINE + zero a11y failures | Done (code fixes); scores Pending operator |
| CI merge gate green | Pending final gate (integration/E2E in CI) |
| Manual device QA | Pending operator |

---

## 9. Acceptance criteria

- [x] All form inputs use `text-base sm:text-sm` on mobile (grep gate clean)
- [x] `useKeyboardInset` hook + unit tests
- [x] Keyboard inset in WeighInSheet, FoodItemEditSheet, ManualMealEntryView, onboarding, settings
- [x] `AppDialog` unchanged (consumer-only integration)
- [x] Auth pages import `formFieldInputClassName` directly
- [x] `scrollFormFieldIntoView` exported + wired on keyboard consumer inputs
- [x] Settings dirty save bar bumps `bottom` by `keyboardInset`
- [x] `inputMode` / `enterKeyHint` audit complete
- [x] `refetchOnWindowFocus: false`; `query-client.test.ts` passes
- [x] PERF-BASELINE.md populated with a11y fix mapping
- [x] A11y code fixes on 3 audited routes (Lighthouse scores Pending operator capture on Vercel preview)
- [x] PR-WO05.md + OPTIMIZATION-MASTER-PLAN + README close-out
- [ ] Merge gate fully green — integration/E2E pending CI
- [x] No new product features; deferred items unchanged

---

## 10. Files changed index

**New**

- `calsnap-web/lib/hooks/use-keyboard-inset.ts`
- `calsnap-web/tests/unit/form-field.test.ts`
- `calsnap-web/tests/unit/use-keyboard-inset.test.ts`
- `calsnap-web/tests/unit/query-client.test.ts`
- `docs/plans/PR-WO05.md`
- `docs/plans/PERF-BASELINE.md`
- `docs/plans/OPTIMIZATION-MASTER-PLAN.md`
- `.cursor/plans/pr_wo05_forms_keyboard_perf.plan.md`

**Modified**

- `calsnap-web/lib/design/form-field.ts`
- `calsnap-web/lib/queries/query-client.ts`
- `calsnap-web/lib/design/colors.ts`
- `calsnap-web/app/globals.css`
- `calsnap-web/app/(auth)/login/page.tsx`
- `calsnap-web/app/(auth)/signup/page.tsx`
- `calsnap-web/app/(onboarding)/onboarding/page.tsx`
- `calsnap-web/app/(app)/settings/page.tsx`
- `calsnap-web/app/(app)/scan/page.tsx`
- `calsnap-web/components/scanner/ManualMealEntryView.tsx`
- `calsnap-web/components/scanner/FoodItemEditSheet.tsx`
- `calsnap-web/components/scanner/MealScannerCaptureView.tsx`
- `calsnap-web/components/scanner/MealTypeSelector.tsx`
- `calsnap-web/components/scanner/MealAnalysisResultView.tsx`
- `calsnap-web/components/scanner/MealScannerAnalyzingView.tsx`
- `calsnap-web/components/scanner/ScannerErrorBanner.tsx`
- `calsnap-web/components/progress/WeighInSheet.tsx`
- `calsnap-web/components/analytics/AnalyticsCustomRangeSheet.tsx`
- `calsnap-web/components/design/HeightInputFields.tsx`
- `calsnap-web/components/design/InlineErrorMessage.tsx`
- `calsnap-web/components/design/FoodItemRowView.tsx`
- `calsnap-web/components/dashboard/DailySummaryFooter.tsx`
- `calsnap-web/components/meal-log/MealListSection.tsx`
- `calsnap-web/components/settings/DataSection.tsx`
- `calsnap-web/components/design/CalorieRingView.tsx`
- `calsnap-web/components/onboarding/DeficitSlider.tsx`

**Post-review fixes (2026-07-01):** onboarding `paddingBottom` conditional; `.dark` contrast text tokens; calorie ring / weigh-in error / deficit slider / height toggle / onboarding validation a11y; `subscribeKeyboardInset` made module-private.
