# CalSnap Web — Performance & Lighthouse Baseline (WO05)

**Captured:** 2026-07-01  
**Commit:** `23fbb3e` (WO05 implementation branch)  
**Environment:** Vercel preview HTTPS (locked WO05 decision #14) — **scores pending operator capture**  
**Chrome:** Mobile preset, throttling on, logged-in onboarded session

> **Policy (WR07 §4):** Lighthouse numeric targets (Perf ≥70, A11y ≥90) are **informative only**. All **accessibility audit failures** on the three audited routes must be fixed before WO05 sign-off. Production parity may differ — operator may re-run on production URL per WR08 §8.

---

## Methodology

1. Deploy WO05 branch to Vercel preview (HTTPS).
2. Sign in with onboarded test account in Chrome incognito.
3. Run Chrome DevTools Lighthouse — **Mobile** preset, throttling enabled.
4. Audit routes: `/dashboard`, `/scan`, `/settings` only (WO05 decision #21).
5. Fix all reported a11y failures; re-run until zero failures on each route.
6. Apply global token/component fixes when root cause is shared (no extra route audits).

---

## Scores table

| Page | Perf | A11y | Best Practices | SEO | Date | Notes |
|------|------|------|----------------|-----|------|-------|
| `/dashboard` | Pending | Pending | Pending | Pending | 2026-07-01 | Capture on Vercel preview after deploy |
| `/scan` | Pending | Pending | Pending | Pending | 2026-07-01 | Capture on Vercel preview after deploy |
| `/settings` | Pending | Pending | Pending | Pending | 2026-07-01 | Capture on Vercel preview after deploy |

**Informative targets:** Perf ≥70, A11y ≥90 per page (non-blocking).

---

## A11y failures found → fix mapping

Code fixes applied in WO05 (pre-Lighthouse verification on audited routes):

| ID | Failure class | Root cause | Fix | Files |
|----|---------------|------------|-----|-------|
| A11Y-01 | Color contrast — warning text on light bg | `#FFCC00` on white ~1.7:1 | `--cs-warning-text` token (`#8a6d00` light) | `globals.css`, `colors.ts`, `DailySummaryFooter.tsx`, `MealAnalysisResultView.tsx`, `FoodItemRowView.tsx` |
| A11Y-02 | Color contrast — danger text on light bg | `#FF3B30` on white ~4.0:1 | `--cs-danger-text` token (`#c41e16` light) | `globals.css`, `colors.ts`, scan/settings/dashboard components |
| A11Y-03 | Form label — metric height | `LocalNumberInput` without associated label | Wrap metric input in `<label>` | `HeightInputFields.tsx` |
| A11Y-04 | Focus indicator — weigh-in weight | `outline-none` without ring | `formFieldFocusRingClassName` | `WeighInSheet.tsx` |
| A11Y-05 | Focus indicator — range sliders | No focus ring on `<input type="range">` | `formFieldFocusRingClassName` | `MacroTargetsSection.tsx` |
| A11Y-06 | Focus indicator — raw buttons | Custom buttons without focus ring | `formFieldFocusRingClassName` on scan/settings/dashboard buttons | `scan/page.tsx`, `ManualMealEntryView.tsx`, `MealScannerAnalyzingView.tsx`, `ScannerErrorBanner.tsx`, `DataSection.tsx`, `WeighInSheet.tsx`, `MealAnalysisResultView.tsx` |
| A11Y-07 | ARIA — meal type selector | Toggle group without radio semantics | `role="radiogroup"` + `role="radio"` + `aria-checked` | `MealTypeSelector.tsx` |
| A11Y-08 | ARIA — weigh-in unit toggle | No pressed state | `aria-pressed` on kg/lbs buttons | `WeighInSheet.tsx` |
| A11Y-09 | Focus order — scan stagger | Tabbable content at `opacity-0` | `inert` until visible | `MealAnalysisResultView.tsx` |
| A11Y-10 | Link distinguishability | Muted links without persistent underline | `underline` on meal-add links | `MealListSection.tsx` |
| A11Y-11 | Live region — analyzing | Loading state not announced | `role="status"` + `aria-live="polite"` + `aria-busy` | `MealScannerAnalyzingView.tsx` |
| A11Y-12 | Live region — errors | Dynamic errors not announced | `role="alert"` on error containers | `InlineErrorMessage.tsx`, `settings/page.tsx` |
| A11Y-13 | iOS input zoom | 14px inputs trigger zoom | `text-base sm:text-sm` on all form controls | `form-field.ts` + inline migrations |
| A11Y-14 | Color contrast — calorie ring band label | `text-cs-warning` on light bg | `text-cs-warning-text` / `text-cs-danger-text` | `CalorieRingView.tsx` |
| A11Y-15 | Color contrast — weigh-in save error | `text-cs-danger` on light bg | `text-cs-danger-text` | `WeighInSheet.tsx` |
| A11Y-16 | Focus indicator — deficit slider | No focus ring on range input | `formFieldFocusRingClassName` | `DeficitSlider.tsx` |
| A11Y-17 | Focus indicator — height unit toggle | No focus ring on toggle button | `formFieldFocusRingClassName` | `HeightInputFields.tsx` |
| A11Y-18 | Live region — onboarding validation | Error text low contrast | `text-cs-danger-text` + `role="alert"` | `onboarding/page.tsx` |
| A11Y-19 | Dark mode manual toggle | `.dark` missing text contrast tokens | `--cs-warning-text` / `--cs-danger-text` in `.dark` | `globals.css` |
| A11Y-20 | Layout — onboarding bottom padding | `paddingBottom: 0` overrode `py-8` | Conditional inline style only when `keyboardInset > 0` | `onboarding/page.tsx` |

**Re-run verification:** Operator captures Lighthouse on Vercel preview after deploy; expect zero a11y audit items on all three routes.

---

## Query tuning note

`refetchOnWindowFocus: false` with `staleTime: 30_000` — tab-switch spinner audit documented in PR-WO05 §8 (manual Pending).

---

## Related docs

- [PR-WO05.md](./PR-WO05.md) — full WO05 findings matrix
- [PR-WR07.md](./PR-WR07.md) §4 — Lighthouse policy
- [PR-WR08.md](./PR-WR08.md) §8 row 18 — production smoke may re-run baseline
