# PR WO03: App Chrome, Tab Bar & Sheets

**Status:** Complete — code + review close-out. Merge gate: lint/unit/build green (216 tests); integration/E2E pending clean emulator env or CI (§2). §8 manual sign-off Pending (operator).
**Sprint:** Optimization WO03 ([OPTIMIZATION-MASTER-PLAN.md](./OPTIMIZATION-MASTER-PLAN.md) — pending)  
**Depends on:** WO01 + WO02 merged to `main`  
**Plan:** [.cursor/plans/wo03_app_chrome_sheets_24159170.plan.md](../../.cursor/plans/wo03_app_chrome_sheets_24159170.plan.md)

---

## Sharpened decisions (locked 2026-07-01)

| # | Decision | Resolved |
|---|----------|----------|
| 1 | Tab bar material | `bg-cs-surface/80 backdrop-blur-md` in `layout.tabBar.nav` |
| 2 | Drag handle | Decorative pill, mobile only (`sm:hidden`); `aria-hidden` |
| 3 | Sheet motion (mobile) | Slide up via custom `@keyframes` in `globals.css` |
| 4 | Sheet motion (sm+) | Keep centered zoom/fade |
| 5 | Reduced motion | CSS-only — `prefers-reduced-motion` + `motion-reduce:animate-none` |
| 6 | Overlay softening | `bg-black/30` when `sheet=true` only; alert-dialog stays `/40` |
| 7 | Dialog refactor | `sheet?: boolean` on `DialogContent`; AppDialog passes through |
| 8 | Elevation token | `layout.elevation.fab` in `layout.ts` |
| 9 | Overscroll | `overscroll-behavior-y: none` on `body` in `display-mode: standalone` only |
| 10 | Sheet consumer scope | Verify WeighIn, Plateau, FoodItemEdit only |
| 11 | E2E delta | 0 new specs — 18 existing must stay green |
| 12 | Unit tests | Extend `layout-safe-area.test.ts` |
| 13 | Tab bar opacity | `/80` (not `/95` like settings save bar) |
| 14 | Mobile sheet top radius | `rounded-t-2xl` |
| 15 | Close X on mobile sheets | Keep |
| 16 | Centered dialog animate-in | Sheet slide only — do not fix centered zoom |
| 17 | Overlay `/30` scope | `sheet=true` prop only |
| 18 | Footer audit count | 3 sheets |
| 19 | Sheet slide easing | `ease-out`, 300ms (`SHEET_SLIDE_MS`) |
| 20 | FAB elevation value | `shadow-lg dark:shadow-lg` |
| 21 | Tab bar blur fallback | No `supports-[backdrop-filter]` guard |
| 22 | Reduced motion impl | CSS-only in globals + `motion-reduce:animate-none` |
| 23 | Overscroll target | `body` only inside standalone media query |
| 24 | Overlay fade timing | Opacity only; keep 200ms fade-in/out |

---

## 1. Audit checklist

| Scope item | Pre-audit | Post-fix |
|------------|-----------|----------|
| Tab bar translucent blur | Fail — opaque `bg-cs-surface` | **Pass** — `bg-cs-surface/80 backdrop-blur-md` in `layout.tabBar.nav` |
| Bottom sheet motion | Fail — inherits centered `zoom-in-95` | **Pass** — mobile slide-up keyframes; sm+ zoom unchanged |
| Drag handle affordance | Fail — none | **Pass** — pill in `AppDialog` when `sheet=true` |
| Sheet overlay softness | Fail — global `bg-black/40` | **Pass** — `bg-black/30` when `sheet=true` |
| ScanFab elevation token | Fail — inline `shadow-lg` | **Pass** — `layout.elevation.fab` |
| Standalone overscroll | Fail — rubber-band active | **Pass** — `overscroll-behavior-y: none` in standalone only |
| WeighIn sheet footer | Pass (WO01) — `min-h-11` primary/secondary; `pb-sheet-safe` | **Pass** — no consumer diff |
| Plateau sheet footer | Pass — ghost dismiss `min-h-11` | **Pass** — no consumer diff |
| FoodItemEdit sheet footer | Pass — Cancel/Save `min-h-11 flex-1` | **Pass** — no consumer diff |
| Alert dialogs | N/A — out of scope | Pass — `alert-dialog.tsx` unchanged (`/40`) |
| WO01 tokens preserved | Pass | **Pass** — `pb-sheet-safe`, `layout.fixed.aboveTabBar`, etc. |

**Sheet footer audit detail:**

| Sheet | Primary CTAs ≥44px | Above home indicator (`pb-sheet-safe`) | Consumer diff |
|-------|-------------------|----------------------------------------|---------------|
| WeighInSheet | Save + Remind Tomorrow `min-h-11` | Via AppDialog default sheet mode | None |
| PlateauAlertSheet | Option cards + ghost dismiss `min-h-11` | Via AppDialog | None |
| FoodItemEditSheet | Cancel/Save `min-h-11 flex-1` | Via AppDialog | None |

**Inherited (no audit row):** `AnalyticsCustomRangeSheet` — receives drag handle, slide, overlay, radius via `AppDialog`.

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

> **Note:** Integration/E2E require Java (`JAVA_HOME=/opt/homebrew/opt/openjdk@21` on this machine).

### Initial baseline (before WO03 implementation — `main` post WO02)

Recorded 2026-07-01:

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **212 tests** (39 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Not run (port 8080 contention) | 15 tests expected (5 files) |
| `pnpm test:e2e` | Not run (emulator/webServer startup) | **18 tests** expected (unchanged) |

### Final merge gate (after WO03 implementation)

Recorded 2026-07-01:

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **216 tests** (39 files) — **+4** `layout-safe-area.test.ts` |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | **Blocked locally** | Port 8080 already bound (orphan Firestore JVM); cannot start emulator |
| `pnpm test:e2e` | **Blocked locally** | `webServer` failed — Firebase emulator UI not reachable on :4000 |

**Expected delta:** +4 unit assertions; E2E count unchanged (18). Achieved for lint/unit/build; integration/E2E require clean emulator ports.

**Review close-out (2026-07-01):** Sheet keyframes use `translate(-50%, …)` for `left-1/2` centering; animation utilities use `fill-mode: both` (prevents one-frame open flash); duration comment links `globals.css` ↔ `SHEET_SLIDE_MS`; unit test asserts both slide-in and slide-out utilities.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WO03-CHROME-01 | **P1** | Tab bar | Opaque surface — no iOS translucency | **Fixed** |
| WO03-SHEET-01 | **P1** | Sheets | Bottom sheets use centered zoom animation | **Fixed** |
| WO03-SHEET-02 | P2 | Sheets | No drag handle affordance | **Fixed** |
| WO03-SHEET-03 | P2 | Sheets | Overlay too heavy for sheets (`/40`) | **Fixed** — `/30` when `sheet=true` |
| WO03-SHEET-04 | P2 | Sheets | No `rounded-t-2xl` on mobile sheets | **Fixed** |
| WO03-FAB-01 | P2 | Chrome | ScanFab shadow not tokenized | **Fixed** |
| WO03-PWA-01 | P2 | PWA | Rubber-band overscroll in standalone | **Fixed** |
| WO03-TEST-01 | **P1** | Tests | No unit coverage for blur/elevation/overscroll/keyframes | **Fixed** |

**Open P0/P1:** None (code). Integration/E2E pending clean local env or CI.

---

## 4. Fix list

| File | Change | Finding |
|------|--------|---------|
| `app/globals.css` | Sheet slide keyframes + utilities (`fill-mode: both`); standalone overscroll on `body` | WO03-SHEET-01, WO03-PWA-01 |
| `lib/design/motion.ts` | `SHEET_SLIDE_MS`, `SHEET_SLIDE_EASING` | WO03-SHEET-01 |
| `components/ui/dialog.tsx` | `sheet` prop; overlay `/30`; mobile slide vs sm+ zoom | WO03-SHEET-01/03 |
| `components/design/AppDialog.tsx` | Pass `sheet`; drag handle; `rounded-t-2xl` | WO03-SHEET-02/04 |
| `lib/design/layout.ts` | Tab bar blur; `elevation.fab` | WO03-CHROME-01, WO03-FAB-01 |
| `components/dashboard/ScanFab.tsx` | Use `layout.elevation.fab` | WO03-FAB-01 |
| `tests/unit/layout-safe-area.test.ts` | +4 assertions (blur, fab, overscroll, keyframes) | WO03-TEST-01 |
| `docs/implementation/web/PR-WO03.md` | This spec | — |

**No consumer diffs:** WeighInSheet, PlateauAlertSheet, FoodItemEditSheet — audit pass.

---

## 5. Design contract

### New token exports (`layout.ts`)

| Export | Value | Purpose |
|--------|-------|---------|
| `layout.tabBar.nav` | … `bg-cs-surface/80 backdrop-blur-md` … | Translucent tab bar over scrolling content |
| `layout.elevation.fab` | `shadow-lg dark:shadow-lg` | ScanFab shadow (position unchanged via `layout.fixed.aboveTabBar`) |

### Motion constants (`motion.ts`)

| Export | Value |
|--------|-------|
| `SHEET_SLIDE_MS` | `300` |
| `SHEET_SLIDE_EASING` | `'ease-out'` |

### CSS additions (`globals.css`)

- `@keyframes sheet-slide-in` / `sheet-slide-out` — `translate(-50%, …)` for centered bottom sheets; 300ms ease-out
- `.animate-sheet-slide-in` / `.animate-sheet-slide-out` — `animation-fill-mode: both`; gated under `prefers-reduced-motion: no-preference`; duration comment syncs with `SHEET_SLIDE_MS`
- `@media (display-mode: standalone) { body { overscroll-behavior-y: none; } }`

### Dialog API

- `DialogContent` accepts optional `sheet?: boolean`
- When `sheet=true`: overlay `bg-black/30`; mobile slide animation; sm+ centered zoom/fade unchanged
- `AppDialog` defaults `sheet=true`; renders drag handle pill before header on mobile

### Preserved WO01 tokens

- `pb-sheet-safe`, `layout.fixed.aboveTabBar`, `layout.content.bottomPadding`, `pb-safe` on tab bar

---

## 6. E2E

**No new specs.** Existing 18 tests unchanged.

| Assert | Detail |
|--------|--------|
| Tab nav visible at 320px | `viewport-320.spec.ts` — selector unchanged |
| No horizontal scroll | Dashboard with blurred tab bar |

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| Sheet slide one-frame flash | **Closed in review** — `animation-fill-mode: both` on sheet utilities |
| Swipe-to-dismiss | Radix has no native swipe; drag handle is decorative only |
| `backdrop-filter` perf | Low risk on single tab bar; monitor on older devices |
| Sheet slide + Radix focus trap | Test weigh-in/plateau manually |
| Centered dialog `animate-in` no-op | Accepted deferral — WO03 fixes sheet slide only |
| Playwright cannot test standalone overscroll | Manual sign-off only |
| Dark mode blur contrast | Verify tab labels readable over scrolled content |
| Local emulator port contention | Port 8080 orphan JVM blocks integration/E2E locally |

---

## 8. Manual sign-off

| Scenario | Environment | Pass criteria | Signed off |
|----------|-------------|---------------|------------|
| Tab bar translucency | iPhone standalone PWA | Content subtly visible through blur; hairline separator | Pending |
| Weigh-in sheet motion | iPhone Safari 320px | Slide up; primary Save ≥44px; above home indicator | Pending |
| Plateau sheet focus trap | iPhone Safari | Tab cycle stays in sheet; dismiss works | Pending |
| Reduced motion | iOS Reduce Motion ON | Sheet opens without slide | Pending |
| Standalone overscroll | iPhone standalone | No rubber-band bounce on dashboard scroll end | Pending |
| Browser overscroll | iPhone Safari browser | Normal bounce preserved | Pending |
| ScanFab elevation | Dashboard standalone | FAB floats above content; no tab overlap | Pending |

---

## 9. Acceptance criteria

- [x] Tab bar translucent blur + safe area intact (WO01 tokens preserved)
- [x] All AppDialog sheets: drag handle, `rounded-t-2xl`, mobile slide-up, close X retained
- [x] Reduced motion disables sheet slide (CSS only; no `useReducedMotion` in AppDialog)
- [x] Sheet overlay `bg-black/30`; alert dialogs unchanged
- [x] ScanFab uses `layout.elevation.fab`; position unchanged
- [x] Standalone overscroll disabled; browser overscroll preserved (CSS media query)
- [x] WeighIn / Plateau / FoodItemEdit primary actions ≥44px and above home indicator (audit documented)
- [x] `layout-safe-area.test.ts` extended (+4 assertions; 216 total)
- [ ] Merge gate fully green — integration/E2E pending clean emulator env or CI
- [x] E2E count unchanged (18); no new specs
- [x] PR-WO03 complete with findings matrix + §8 Pending manual rows
- [x] No Serwist / manifest / SW / new routes / tab IA changes

---

## 10. Files changed index

**New**

- `docs/implementation/web/PR-WO03.md`

**Modified**

- `calsnap-web/app/globals.css`
- `calsnap-web/lib/design/motion.ts`
- `calsnap-web/lib/design/layout.ts`
- `calsnap-web/components/ui/dialog.tsx`
- `calsnap-web/components/design/AppDialog.tsx`
- `calsnap-web/components/dashboard/ScanFab.tsx`
- `calsnap-web/tests/unit/layout-safe-area.test.ts`
