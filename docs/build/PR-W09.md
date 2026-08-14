# PR W09: Design System Polish and UX

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w09_design_polish_ec6d0857.plan.md`](../../../.cursor/plans/pr_w09_design_polish_ec6d0857.plan.md), iOS [PR-9](../PR-09.md)

---

## 1. Objective

Establish the production visual language for CalSnap Web: design tokens, dark mode (system `prefers-color-scheme`), centralized English copy module, shared design components, shadcn Dialog/AlertDialog accessibility, and animations — mirroring iOS PR-9 without new features or schema changes.

---

## 2. In scope

- `lib/design/` — colors, typography, layout, motion, calorie-ring accessibility
- `app/globals.css` — Tailwind v4 `@theme` with `--cs-*` CSS variables (light + dark from iOS assets)
- shadcn foundation — `dialog`, `alert-dialog`, `button`, `lib/utils/cn.ts`
- `lib/copy/` — `copy()` helper + feature namespaces; all user-facing strings migrated
- `components/design/` — SectionCard, EmptyStateView, CalorieRingView, MacroBarView, ConfidenceBadge, FoodItemRowView, NutrientStatRow, AppDialog, PrimaryButton, ConfirmAlertDialog
- 5 sheets → shadcn Dialog via AppDialog; all confirms → AlertDialog
- Ring spring animation, scan result stagger, chart animation gating via `useReducedMotion`
- Token + copy pass across W01–W08 screens
- Unit tests: design-colors, calorie-ring-accessibility, copy

---

## 3. Out of scope

- PWA/manifest (W10), Playwright E2E (W10)
- shadcn Input/Slider/Select migration
- Settings appearance toggle (system dark mode only)
- Firestore/schema changes, new routes/features
- ESLint copy guard enforcement (documented only)

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `lib/design/colors.ts` | iOS hex maps, band → color mapping |
| `lib/design/typography.ts` | Tailwind class bundles |
| `lib/design/layout.ts` | Ring, macro bar, touch target dimensions |
| `lib/design/motion.ts` | Spring constants, `useReducedMotion` |
| `lib/design/calorie-ring-accessibility.ts` | ARIA label/value helpers |
| `lib/copy/*` | Copy registry + namespaces |
| `lib/utils/cn.ts` | clsx + tailwind-merge |
| `components/design/*` | Shared presentation components |
| `components/ui/{button,dialog,alert-dialog}.tsx` | shadcn primitives |
| `tests/unit/design-colors.test.ts` | Band color mapping |
| `tests/unit/calorie-ring-accessibility.test.ts` | ARIA strings |
| `tests/unit/copy.test.ts` | Interpolation + designSystem keys |

---

## 5. Files deleted / consolidated

| Removed | Replaced by |
|---------|-------------|
| `components/settings/SettingsSectionCard.tsx` | `SectionCard` |
| `components/analytics/AnalyticsSectionCard.tsx` | `SectionCard` |
| `components/analytics/AnalyticsEmptyState.tsx` | `EmptyStateView` |
| `components/scanner/ConfidenceBadge.tsx` | `components/design/ConfidenceBadge` |

---

## 6. Web deltas vs iOS PR-9

| Area | iOS | Web W09 |
|------|-----|---------|
| Dark mode | Asset catalog adaptive | CSS variables + `prefers-color-scheme`; `.dark` class for tests |
| Macro card | Composition bar only | Composition bar + target progress rows + fiber |
| Copy | `Localizable.xcstrings` | `lib/copy/` TypeScript modules |
| Focus trap | SwiftUI sheet default | shadcn Dialog / Radix |
| Primary CTA | `csPrimary` green | `bg-cs-primary` replaces `bg-neutral-900` |

---

## 7. Tests

```bash
cd calsnap-web && pnpm install && pnpm test && pnpm lint && pnpm build
```

New tests cover band → color mapping, calorie ring ARIA strings, and copy interpolation. All W01–W08 unit tests must remain green.

---

## 8. Manual QA

1. Light + dark mode on all tabs — green primary CTAs, readable surfaces
2. 320px viewport at ~200% zoom — no horizontal scroll; ring number truncates
3. Calorie ring — VoiceOver reads remaining/over; band label in high contrast
4. Scan flow — food items stagger in; reduced motion shows instant list
5. Sheets — focus trap, Escape closes, min-h-11 actions
6. Empty states — Log, analytics, weigh-in history have copy + action button
7. W03–W08 flows unchanged functionally

---

## 9. Copy key convention

Keys mirror iOS: `designSystem.calorieRing.remaining`, `dashboard.macros.title`, etc. Components import `copy('namespace.key', { params })` only; lib helpers that return user-facing strings call `copy()` internally.

Optional future: ESLint rule blocking literal strings in `components/` outside `lib/copy/`.
