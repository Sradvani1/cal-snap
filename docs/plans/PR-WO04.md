# PR WO04: Loading States & Auth Bootstrap

**Status:** Complete — review fixes applied; merge gate lint/unit/build green (222 tests). Integration/E2E pending clean emulator env or CI (§2). §8 manual sign-off Pending (operator).  
**Sprint:** Optimization WO04 ([web optimization sprint plan](../../.cursor/plans/web_optimization_sprint_68cb0f71.plan.md))  
**Depends on:** WO01 (`4ea0500`) + WO02 (`c2ab40f`) + WO03 (`6e1a511`) merged to `main`  
**Plan:** [.cursor/plans/pr_wo04_loading_bootstrap.plan.md](../../.cursor/plans/pr_wo04_loading_bootstrap.plan.md)

---

## Sharpened decisions (locked 2026-07-01)

| # | Decision | Resolved |
|---|----------|----------|
| 1 | App shell bootstrap surface | `AppShellSkeleton` composes **existing** dashboard skeleton exports; `layout.pageShell` + `layout.content.bottomPadding` |
| 2 | Tab bar during bootstrap | **Never render** `BottomTabNav` / `InstallPromptBanner` until `ready === true` |
| 3 | Layout gate condition | Single check: `if (!ready) return <AppShellSkeleton />` — drop redundant `loading \|\| !user` |
| 4 | `useRequireAuth` loading | `profile.isPending` while `user` exists (not only `isLoading`); **no prefetch** |
| 5 | `Skeleton.tsx` pulse | `animate-pulse` when `!useReducedMotion()`; static fill when reduced motion |
| 6 | Settings skeleton sections | Page title + **3× `SectionCardSkeleton`** only (Profile, Macro, Units) |
| 7 | Meal detail skeleton API | `MealDetailSkeleton` with `variant: 'detail' \| 'edit'` and `showPhoto?: boolean` (default `true`) |
| 8 | Auth skeleton placement | `AuthFormSkeleton` replaces page children only; `(auth)/layout.tsx` card chrome unchanged |
| 9 | Onboarding skeleton layout | Progress bar + card + footer placeholders; defensive on layout **and** page |
| 10 | `common.loading` on gates | **Zero** on app/auth/onboarding gates; keep for submit states |
| 11 | Unit tests | `tests/unit/skeleton.test.ts` — reduced-motion class + smoke renders |
| 12 | E2E delta | **0** new specs |
| 13 | Dashboard double skeleton | **Accept** — bootstrap skeleton, then unchanged dashboard page skeletons |
| 14 | Scan route | **Defer entirely** — no `ScanCaptureSkeleton` |
| 15 | Edit route non-results phase | `MealDetailSkeleton variant="edit" showPhoto={false}` |
| 16 | Gate skeleton a11y | `aria-busy="true"` on gate skeleton root wrappers |
| 17 | Settings pulse / reduced motion | **Accept mismatch** — `SectionCardSkeleton` as-is |
| 18 | Meal detail title layout | `MealDetailSkeleton` includes title placeholder |
| 19 | Profile bootstrap flag | `Boolean(user) && profile.isPending` only |
| 20 | Unit test nav assert | **Merge-blocking** — `AppShellSkeleton` must not render `common.nav.main` nav landmark |

---

## 1. Audit checklist

| Scope item | Pre-audit | Post-fix |
|------------|-----------|----------|
| App auth gate | Fail — `common.loading` text in `(app)/layout.tsx` | **Pass** — `AppShellSkeleton` on `<main aria-busy="true">`; no tab bar until `ready` |
| Login / signup gates | Fail — `common.loading` text | **Pass** — `AuthFormSkeleton` inside auth card shell |
| Onboarding gate | Fail — `common.loading` in layout + page | **Pass** — `OnboardingStepSkeleton` (defensive on both) |
| Settings loading | Fail — single `h-96` pulse block | **Pass** — title + 3× `SectionCardSkeleton` |
| Meal detail / edit | Fail — inline `animate-pulse` | **Pass** — shared `MealDetailSkeleton` (both edit branches) |
| Shared primitive | Fail — ad-hoc pulse classes | **Pass** — `Skeleton.tsx` with `useReducedMotion()` gating |
| Dashboard/progress `*Skeleton` exports | Pass — working | **Pass** — untouched |
| Scan capture skeleton | N/A — deferred | **Pass** — not added |
| `common.loading` grep on gate files | Fail — 5 gate surfaces | **Pass** — zero hits |

**Gate grep command** (from `calsnap-web/`):

```bash
rg 'common\.loading' \
  'app/(app)/layout.tsx' \
  'app/(auth)/login/page.tsx' \
  'app/(auth)/signup/page.tsx' \
  'app/(onboarding)/layout.tsx' \
  'app/(onboarding)/onboarding/page.tsx' \
  'app/(app)/settings/page.tsx' \
  'app/(app)/log/[mealId]/page.tsx' \
  'app/(app)/scan/edit/[mealId]/page.tsx'
```

**Post-fix result:** 0 hits (2026-07-01).

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

> **Note:** Integration/E2E require Java (`JAVA_HOME=/opt/homebrew/opt/openjdk@21` on this machine).

### Initial baseline (before WO04 implementation — `main` post WO03)

Recorded 2026-07-01:

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **216 tests** (39 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Not run (port 8080 contention) | 15 tests expected (5 files) |
| `pnpm test:e2e` | Not run | **18 tests** expected (unchanged) |

### Final merge gate (after WO04 implementation)

Recorded 2026-07-01:

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **222 tests** (40 files) — **+6** `skeleton.test.ts` |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | **Blocked locally** | Port 8080 already bound (orphan Firestore JVM) |
| `pnpm test:e2e` | **Not run** | Port contention — 18 tests expected unchanged |

**Expected delta:** +6 unit tests; E2E count unchanged (18). Achieved for lint/unit/build; integration/E2E require clean emulator ports or CI.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WO04-BOOT-01 | **P1** | Bootstrap | App layout shows loading text during auth/profile bootstrap | **Fixed** |
| WO04-BOOT-02 | **P1** | Bootstrap | Tab bar visible before auth confirmed | **Fixed** — content-only `AppShellSkeleton` |
| WO04-AUTH-01 | **P1** | Auth | Login/signup show loading text while session resolves | **Fixed** |
| WO04-ONB-01 | **P1** | Onboarding | Layout/page show loading text during gate | **Fixed** |
| WO04-SET-01 | P2 | Settings | Single opaque pulse block — poor layout fidelity | **Fixed** |
| WO04-MEAL-01 | P2 | Meal routes | Inline pulse duplicated across detail/edit | **Fixed** |
| WO04-PRIM-01 | P2 | Design system | No shared skeleton primitive with reduced-motion gating | **Fixed** |
| WO04-TEST-01 | **P1** | Tests | No unit coverage for skeleton gates / nav invariant | **Fixed** |

**Open P0/P1:** None (code). Integration/E2E pending clean local env or CI.

---

## 4. Fix list

| File | Change | Finding |
|------|--------|---------|
| `components/design/Skeleton.tsx` | New primitive — pulse gated by `useReducedMotion()` | WO04-PRIM-01 |
| `components/app/AppShellSkeleton.tsx` | Compose dashboard `*Skeleton` exports; no tab bar; `aria-busy` on layout `<main>` only | WO04-BOOT-01/02 |
| `lib/auth/auth-context.tsx` | `profile.isPending` bootstrap flag; no prefetch | WO04-BOOT-01 |
| `app/(app)/layout.tsx` | `!ready` → `<main aria-busy><AppShellSkeleton /></main>` | WO04-BOOT-01/02 |
| `components/auth/AuthFormSkeleton.tsx` | Auth form placeholder blocks | WO04-AUTH-01 |
| `app/(auth)/login/page.tsx` | Replace loading text with `AuthFormSkeleton` | WO04-AUTH-01 |
| `app/(auth)/signup/page.tsx` | Replace loading text with `AuthFormSkeleton` | WO04-AUTH-01 |
| `components/onboarding/OnboardingStepSkeleton.tsx` | Progress + card + footer placeholders | WO04-ONB-01 |
| `app/(onboarding)/layout.tsx` | Gate skeleton on `<main aria-busy>` | WO04-ONB-01 |
| `app/(onboarding)/onboarding/page.tsx` | Defensive page-level skeleton | WO04-ONB-01 |
| `components/settings/SettingsPageSkeleton.tsx` | Title + 3× `SectionCardSkeleton` | WO04-SET-01 |
| `app/(app)/settings/page.tsx` | Wire `SettingsPageSkeleton` | WO04-SET-01 |
| `components/meal-log/MealDetailSkeleton.tsx` | `variant` + `showPhoto` API | WO04-MEAL-01 |
| `app/(app)/log/[mealId]/page.tsx` | `variant="detail"` | WO04-MEAL-01 |
| `app/(app)/scan/edit/[mealId]/page.tsx` | Both loading branches | WO04-MEAL-01 |
| `tests/unit/skeleton.test.ts` | Reduced motion + smoke + nav assert | WO04-TEST-01 |
| `docs/plans/PR-WO04.md` | This spec | — |

---

## 5. Design contract

### Bootstrap state machine

| State | `ready` | UI (app routes) |
|-------|---------|-----------------|
| Auth pending | `false` | `AppShellSkeleton` |
| No user (redirecting `/login`) | `false` | `AppShellSkeleton` |
| User + profile pending | `false` | `AppShellSkeleton` |
| User + onboarding incomplete | `false` | `AppShellSkeleton` |
| User + onboarded | `true` | Tab bar + children → page may show own data skeletons |

### `useRequireAuth` loading

```ts
const profileBootstrapping = Boolean(user) && profile.isPending;
const loading = authLoading || profileBootstrapping;
```

Layout gates on `ready` only — single `if (!ready)` branch.

### `Skeleton` primitive

- Base: `rounded bg-cs-muted/20`
- Pulse: `animate-pulse` when `!useReducedMotion()`
- Decorative blocks: `aria-hidden` on primitive; gate roots use `aria-busy="true"`

### `MealDetailSkeleton` API

| Variant | Blocks |
|---------|--------|
| `detail` | Title, photo (`aspect-[4/3]`), 2–3 macro row stubs |
| `edit` + `showPhoto={true}` | Title, photo, form block (`h-24`) |
| `edit` + `showPhoto={false}` | Title, form block only |

### Preserved (gates-only scope)

- Dashboard/progress `*Skeleton` exports unchanged
- `SectionCardSkeleton` always pulses (no reduced-motion migration)
- No scan capture skeleton
- No profile prefetch

---

## 6. Tests

### Unit (`tests/unit/skeleton.test.ts`)

| Test | Purpose |
|------|---------|
| `Skeleton` omits `animate-pulse` when reduced motion mocked | Decision #5 |
| `Skeleton` applies `animate-pulse` when motion allowed | Decision #5 |
| `AppShellSkeleton` smoke render | Decision #11 — `aria-busy` on layout `<main>`, not component |
| `AppShellSkeleton` has no `<nav>` / `common.nav.main` | Decision #20 — **merge-blocking** |
| `AuthFormSkeleton` smoke render | Decision #11 |
| `MealDetailSkeleton` detail + edit variants | Decision #11 |

**Count:** 216 → **222** (+6).

### E2E

**No new specs.** Existing 18 tests unchanged; no loading-text selectors on gates.

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| Dashboard double skeleton | **Accepted** — `AppShellSkeleton` at bootstrap, then dashboard page skeletons while queries load; WO05 perf sign-off if LCP concern |
| Settings lower sections pop-in | **Accepted** — 3 core sections only (Profile, Macro, Units) |
| Settings `SectionCardSkeleton` always pulses | **Accepted** — gates-only; no `SectionCardSkeleton` migration |
| Scan flash | **Deferred** — fix-only in future PR if device QA finds issue |
| Local emulator port contention | Port 8080 orphan JVM blocks integration/E2E locally |

---

## 8. Manual sign-off

| Scenario | Environment | Pass criteria | Signed off |
|----------|-------------|---------------|------------|
| Cold app launch (signed in) | iPhone standalone PWA | Dashboard-shaped skeleton; no tab bar flash; tab bar appears when ready | Pending |
| Login redirect | iPhone Safari 320px | Form skeleton inside card; no "Loading…" text | Pending |
| Onboarding gate | Fresh account | Progress + card skeleton; no loading text | Pending |
| Settings load | Settings tab | Title + 3 section cards skeleton | Pending |
| Meal detail load | Log → meal tap | Title + photo skeleton; no layout jump on load | Pending |
| Reduced motion | iOS Reduce Motion ON | Gate skeletons static (no pulse on `Skeleton` primitive) | Pending |

---

## 9. Acceptance criteria

- [x] `Skeleton.tsx` + reduced-motion gating
- [x] `AppShellSkeleton` content-only; `!ready` gate in `(app)/layout`
- [x] Auth/onboarding gates: skeletons, no `common.loading` text
- [x] Settings: title + 3 `SectionCardSkeleton`
- [x] `MealDetailSkeleton` on detail + both edit-route branches
- [x] `useRequireAuth` uses `profile.isPending`; no prefetch
- [x] Dashboard/progress `*Skeleton` exports untouched
- [x] Scan skeleton **not** added
- [x] Gate skeleton roots use `aria-busy="true"`
- [x] Unit test: `AppShellSkeleton` has no tab nav landmark
- [x] `PR-WO04.md` + README updated
- [ ] Merge gate fully green — integration/E2E pending clean emulator env or CI

---

## 10. Files changed index

**New**

- `calsnap-web/components/design/Skeleton.tsx`
- `calsnap-web/components/app/AppShellSkeleton.tsx`
- `calsnap-web/components/auth/AuthFormSkeleton.tsx`
- `calsnap-web/components/onboarding/OnboardingStepSkeleton.tsx`
- `calsnap-web/components/settings/SettingsPageSkeleton.tsx`
- `calsnap-web/components/meal-log/MealDetailSkeleton.tsx`
- `calsnap-web/tests/unit/skeleton.test.ts`
- `docs/plans/PR-WO04.md`

**Modified**

- `calsnap-web/lib/auth/auth-context.tsx`
- `calsnap-web/app/(app)/layout.tsx`
- `calsnap-web/app/(auth)/login/page.tsx`
- `calsnap-web/app/(auth)/signup/page.tsx`
- `calsnap-web/app/(onboarding)/layout.tsx`
- `calsnap-web/app/(onboarding)/onboarding/page.tsx`
- `calsnap-web/app/(app)/settings/page.tsx`
- `calsnap-web/app/(app)/log/[mealId]/page.tsx`
- `calsnap-web/app/(app)/scan/edit/[mealId]/page.tsx`
- `docs/plans/README.md`
