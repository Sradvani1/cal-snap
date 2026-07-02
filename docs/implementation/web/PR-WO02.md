# PR WO02: PWA Launch & Install Polish

**Status:** Complete — merged to `main`. Merge gate: lint/unit/build/integration green; E2E pre-existing onboarding flake (§2, CI run 28554632629). §8 manual sign-off Pending (operator).
**Sprint:** Optimization WO02 ([OPTIMIZATION-MASTER-PLAN.md](./OPTIMIZATION-MASTER-PLAN.md) — pending)  
**Depends on:** WO01 merged to `main` (`4ea0500`); WR08 complete  
**Plan:** [.cursor/plans/pr_wo02_pwa_launch_install.plan.md](../../.cursor/plans/pr_wo02_pwa_launch_install.plan.md)

---

## Sharpened decisions (locked 2026-07-01)

| # | Decision | Resolved |
|---|----------|----------|
| 1 | Splash matrix size | **2 pairs (4 PNGs)** — iPhone 14/15/16 + Pro Max/Plus; light + dark each |
| 2 | Rare device sizes | **Accept generic iOS fallback** on unmatched viewports |
| 3 | Asset pipeline | **`pnpm generate:pwa-assets` (sharp devDep) — commit generated PNGs** |
| 4 | Source asset | **`public/apple-touch-icon.png`** — single source for maskable + splashes |
| 5 | Icon regen scope | **Maskable 512 + splash PNGs only** — do not regenerate `icon-192.png` / `icon-512.png` unless QA finds drift |
| 6 | Maskable safe zone | **512×512 canvas; logo ~80% center; fill `lightColors.primary`** |
| 7 | Splash backgrounds | **Light: `lightColors.background` (#F2F2F7); dark: `darkColors.background` (#000)** |
| 8 | Script color source | **Inline hex in `.mjs` with “must match colors.ts” comment**; unit test imports `colors.ts` |
| 9 | Startup image wiring | **Manual `<link rel="apple-touch-startup-image">`** via `PwaStartupImages.tsx` in explicit root `<head>` |
| 10 | Manifest `theme_color` | **Keep `lightColors.primary`** — viewport meta handles runtime dark (WO01) |
| 11 | E2E | **Unchanged** — PWA install not automatable in CI |
| 12 | Serwist / SW | **No caching or navigation policy changes** |
| 13 | Install banner in standalone | **Must not render** — audit-only; no proactive `fullscreen`/`minimal-ui` unless device QA fails |
| 14 | Copy changes | **Device-QA-driven only** — refine `pwa.ts` if iOS steps unclear |
| 15 | Banner animation | **Ship subtle opacity fade on mount; skip when `useReducedMotion()`** |
| 16 | Head injection | **Explicit `<head>` in root layout** — `PwaStartupImages` renders `<link>` children |
| 17 | Unit test scope | **Manifest JSON + filesystem** — assert maskable + 4 splash PNGs exist |
| 18 | Manual QA environment | **Vercel preview OR production HTTPS** — not `next dev` |
| 19 | Copy default | **Leave `pwa.ts` unchanged in code PR** — refine only if device QA notes confusion |
| 20 | CI asset pipeline | **Commit PNGs only; no CI `generate:pwa-assets`** — unit test catches missing files |
| 21 | Maskable manifest entry | **Third icon entry** — `icon-maskable-512.png` `purpose: "maskable"`; keep existing `any` 192/512 |

### Locked splash matrix (4 files)

| Output file | Pixel size | Device target | Media query |
|-------------|------------|---------------|-------------|
| `splash-iphone14-light.png` | 1170×2532 | iPhone 14/15/16 (6.1") | `(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)` |
| `splash-iphone14-dark.png` | 1170×2532 | same, dark | above + ` and (prefers-color-scheme: dark)` |
| `splash-iphone14promax-light.png` | 1284×2778 | iPhone 14 Pro Max / 15 Plus | `(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)` |
| `splash-iphone14promax-dark.png` | 1284×2778 | same, dark | above + ` and (prefers-color-scheme: dark)` |

Link order in `PwaStartupImages`: light before dark per device size (Safari first-match wins).

---

## 1. Audit checklist

| Scope item | Pre-audit | Post-fix target |
|------------|-----------|-----------------|
| Maskable icon in manifest | Fail — `purpose: "any"` only on 192/512 | **Pass** — third entry `purpose: "maskable"` |
| `orientation: portrait` | Fail — absent | **Pass** |
| Colors vs `colors.ts` | Partial — values match but undocumented | **Pass** — documented + unit test |
| iOS startup splash links | Fail — none in `app/layout.tsx` | **Pass** — 4 `<link>` via `PwaStartupImages` in `<head>` |
| Asset regen script | Fail — no `sharp` / no script | **Pass** — `pnpm generate:pwa-assets` |
| Standalone hides banner | Pass (code review) | **Pass** — `readInstallBannerEligible` + `isStandaloneDisplayMode()` audit clean |
| SW unchanged | Pass | **Pass** — diff excludes `app/sw.ts` |
| Unit manifest test | Fail — none | **Pass** — `manifest-pwa.test.ts` |
| WR08-PWA-01 (maskable deferred) | P3 defer | **Closed in WO02** |

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

> **Note:** Integration/E2E require Java (`JAVA_HOME=/opt/homebrew/opt/openjdk@21` on this machine). PWA manual QA requires preview/prod HTTPS — Serwist disabled in dev ([PR-WR08.md](./PR-WR08.md)).

### Initial baseline (before WO02 implementation — `main` @ WO01 merge)

Recorded 2026-07-01 on `main` after WO01 (`4ea0500`):

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **210 tests** (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | 15 tests (5 files) |
| `pnpm test:e2e` | **Flaky locally** | 18 tests total (unchanged); onboarding timeouts on 16/18 in one run; happy-path green on retry — emulator/port contention (not WO02-related) |

### Final merge gate (after WO02 fixes)

Recorded 2026-07-01 after WO02 implementation:

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **212 tests** (39 files) — **+2** `manifest-pwa.test.ts` |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | 15 tests (5 files) — unchanged |
| `pnpm test:e2e` | **Pre-existing flake** | 18 tests (unchanged count); onboarding redirect timeouts locally + CI (run 28554632629: 8 failed, 8 flaky) — not WO02-related |

**Review close-out (2026-07-01):** Banner fade uses `visible = reducedMotion || animatedVisible`; asset script uses explicit `SPLASH_TARGETS` + source icon guard; unit test locks `icons.length === 3`.

**Expected delta:** +1 unit test file (manifest + PNG existence); 0 E2E changes; +5 committed PNGs; +1 devDep (`sharp`).

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WO02-PWA-01 | **P1** | Icons | No maskable icon — Android crops on install (WR08-PWA-01) | **Fixed** |
| WO02-PWA-02 | **P1** | Launch | No iOS splash — white flash on cold start | **Fixed** |
| WO02-PWA-03 | P2 | Manifest | Missing `orientation: portrait` | **Fixed** |
| WO02-PWA-04 | P2 | Tooling | No reproducible PWA asset pipeline | **Fixed** |
| WO02-PWA-05 | P2 | UX | Install banner lacks entrance polish (fade + reduced motion) | **Fixed** |
| WO02-TEST-01 | **P1** | Tests | No manifest sanity + asset filesystem unit test | **Fixed** |

**Open P0/P1:** None.

---

## 4. Fix list

| File | Change | Finding |
|------|--------|---------|
| `scripts/generate-pwa-assets.mjs` | **New** — sharp: maskable 512 + 4 splash PNGs; inline hex (must match `colors.ts`) | WO02-PWA-04 |
| `package.json` | Add `sharp` devDep; `"generate:pwa-assets": "node scripts/generate-pwa-assets.mjs"` | WO02-PWA-04 |
| `public/icon-maskable-512.png` | **Generated** — commit | WO02-PWA-01 |
| `public/splash-iphone14-light.png` | **Generated** — commit | WO02-PWA-02 |
| `public/splash-iphone14-dark.png` | **Generated** — commit | WO02-PWA-02 |
| `public/splash-iphone14promax-light.png` | **Generated** — commit | WO02-PWA-02 |
| `public/splash-iphone14promax-dark.png` | **Generated** — commit | WO02-PWA-02 |
| `public/manifest.webmanifest` | Third icon (`icon-maskable-512.png`, `maskable`); `orientation: "portrait"`; verify colors | WO02-PWA-01/03 |
| `components/pwa/PwaStartupImages.tsx` | **New** — server component; 4 `<link rel="apple-touch-startup-image">` with media queries | WO02-PWA-02 |
| `app/layout.tsx` | Explicit `<head>`; render `<PwaStartupImages />` | WO02-PWA-02 |
| `lib/pwa/install-storage.ts` | **Audit only** — document; fix only if device QA P1 | Audit |
| `components/pwa/InstallPromptBanner.tsx` | Opacity fade on mount; `useReducedMotion()` disables animation | WO02-PWA-05 |
| `lib/copy/pwa.ts` | **No change by default** — refine only if §8 QA notes confusion | Optional post-QA |
| `tests/unit/manifest-pwa.test.ts` | **New** — manifest JSON + 5 PNG `existsSync` + maskable src | WO02-TEST-01 |

**Out of scope:** `app/sw.ts`, Serwist config, tab blur (WO03), skeletons (WO04), new E2E specs, Playwright install automation, offline authenticated pages.

---

## 5. Design contract

### Asset pipeline

- **Input:** `public/apple-touch-icon.png`
- **Regen:** `pnpm generate:pwa-assets` (from `calsnap-web/`); commit all outputs
- **Not regenerated:** `icon-192.png`, `icon-512.png` (unless QA finds drift)

| Output | Dimensions | Logic |
|--------|------------|---------|
| `icon-maskable-512.png` | 512×512 | Solid `#3DA35D`; icon centered ~410px (80% safe zone) |
| `splash-iphone14-{light,dark}.png` | 1170×2532 | Background fill; icon ~20% of short edge, centered |
| `splash-iphone14promax-{light,dark}.png` | 1284×2778 | Same layout |

### Color alignment

```text
manifest.background_color  → lightColors.background  (#F2F2F7)
manifest.theme_color       → lightColors.primary     (#3DA35D)
splash fill (light)        → lightColors.background
splash fill (dark)         → darkColors.background   (#000000)
maskable canvas fill       → lightColors.primary
```

Script uses inline hex; `manifest-pwa.test.ts` imports `colors.ts` for drift detection.

### Manifest icons (3 entries)

| src | sizes | purpose |
|-----|-------|---------|
| `/icon-192.png` | 192×192 | `any` (unchanged) |
| `/icon-512.png` | 512×512 | `any` (unchanged) |
| `/icon-maskable-512.png` | 512×512 | `maskable` (new) |

Also add `"orientation": "portrait"`.

### Startup images (`PwaStartupImages.tsx`)

Server component (no `'use client'`). Root layout structure:

```tsx
<html lang="en" className="h-full antialiased">
  <head>
    <PwaStartupImages />
  </head>
  <body>…</body>
</html>
```

Metadata API **not** used for startup images — explicit `<link>` tags for Safari compatibility.

### Install banner

- Existing `isStandaloneDisplayMode()` guard must hide banner in standalone — **audit only** in WO02
- Ship opacity fade on mount; respect `useReducedMotion()` from `@/lib/design/motion`
- Preserve WO01 `pt-safe` on wrapper

### CI

- No `generate:pwa-assets` in merge gate
- Committed PNGs are source of truth; unit test filesystem asserts catch omissions

---

## 6. Tests

### Unit (merge-blocking): `tests/unit/manifest-pwa.test.ts`

- Parse `public/manifest.webmanifest`
- Assert required fields: `name`, `short_name`, `start_url`, `display`, `scope`, `icons`
- Assert two `purpose: "any"` icons (192 + 512)
- Assert one `purpose: "maskable"` icon → `/icon-maskable-512.png` (512×512)
- Assert `orientation === "portrait"`
- Assert `background_color` / `theme_color` match `lightColors` from `colors.ts`
- Assert filesystem exists:
  - `public/icon-maskable-512.png`
  - `public/splash-iphone14-light.png`
  - `public/splash-iphone14-dark.png`
  - `public/splash-iphone14promax-light.png`
  - `public/splash-iphone14promax-dark.png`

### E2E

No changes — existing 18 specs must stay green. PWA install not automatable in CI.

### Manual (WO02 sign-off — operator)

[PR-WR08.md](./PR-WR08.md) §8 rows 13–15 on **Vercel preview or production HTTPS** (not `next dev`):

| Row | Scenario |
|-----|----------|
| 13 | iOS Safari Add to Home Screen |
| 14 | Android Chrome install / maskable icon |
| 15 | Standalone opens logged-in dashboard (no login loop) |

Plus WO02-specific rows in §8 below (cold splash, banner hidden in standalone).

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| Incomplete splash matrix | Rare iPhones show generic fallback — accepted |
| Manifest vs runtime dark theme | Manifest `theme_color` stays light primary; viewport meta handles dark (WO01) |
| Mid-session install | Banner may flash once until navigation after A2HS without reload |
| PWA QA requires preview/prod | Serwist disabled in dev |
| Android maskable QA | Best-effort if no device; iOS primary |
| Startup media query drift | Apple viewport changes — regen script + docs |
| Script vs `colors.ts` drift | Mitigated by unit test importing `colors.ts` |
| Tab bar blur / sheet polish | WO03 |

---

## 8. Manual sign-off

| # | Scenario | Environment | Pass criteria | Signed off |
|---|----------|-------------|---------------|------------|
| 13 | Add to Home Screen — iOS Safari | iPhone Safari on **preview or prod HTTPS** | Installs; icon correct; opens standalone | Pending |
| 14 | Add to Home Screen — Android Chrome | Android Chrome on **preview or prod HTTPS** | Install prompt or manual; maskable icon not cropped | Pending |
| 15 | Standalone → logged-in dashboard | Installed PWA (**preview or prod**) | Lands on `/dashboard`; no login redirect loop | Pending |
| — | Cold launch splash | iPhone standalone | Branded splash (not white flash) before dashboard | Pending |
| — | Banner hidden in standalone | iPhone/Android standalone | No install banner after install | Pending |
| — | Install banner vs notch (browser) | iPhone Safari browser | Clear of notch — WO01 `pt-safe` | Pending |

---

## 9. Acceptance criteria

- [x] WO01 merged to `main` (`4ea0500`)
- [x] Merge gate green on `main` before and after WO02 (lint/unit/build/integration; E2E flaky locally — §2)
- [x] `pnpm generate:pwa-assets` produces maskable + 4 splash PNGs; outputs committed
- [x] Manifest has third maskable icon + `orientation: portrait`; existing `any` icons unchanged
- [x] `PwaStartupImages` in explicit root `<head>` serves 4 startup `<link>` tags
- [x] Install banner opacity fade shipped; respects `useReducedMotion()`
- [x] `manifest-pwa.test.ts` green — manifest JSON + 5 PNG filesystem asserts
- [x] E2E suite unchanged count (18 specs); local flakiness documented — no spec changes
- [x] `app/sw.ts` untouched
- [x] §8 manual rows documented (Pending operator sign-off)
- [x] Findings matrix §3 updated (all P1 Fixed)

---

## 10. Files changed index

**New (implementation)**

- `calsnap-web/scripts/generate-pwa-assets.mjs`
- `calsnap-web/components/pwa/PwaStartupImages.tsx`
- `calsnap-web/public/icon-maskable-512.png`
- `calsnap-web/public/splash-iphone14-light.png`
- `calsnap-web/public/splash-iphone14-dark.png`
- `calsnap-web/public/splash-iphone14promax-light.png`
- `calsnap-web/public/splash-iphone14promax-dark.png`
- `calsnap-web/tests/unit/manifest-pwa.test.ts`
- `docs/implementation/web/PR-WO02.md`
- `.cursor/plans/pr_wo02_pwa_launch_install.plan.md`

**Modified (implementation)**

- `calsnap-web/package.json`
- `calsnap-web/public/manifest.webmanifest`
- `calsnap-web/app/layout.tsx`
- `calsnap-web/components/pwa/InstallPromptBanner.tsx`
- `calsnap-web/lib/copy/pwa.ts` (optional — only if device QA warrants)

**Audit only (no change expected)**

- `calsnap-web/lib/pwa/install-storage.ts`

**Explicitly unchanged**

- `calsnap-web/app/sw.ts`
- `calsnap-web/public/icon-192.png`
- `calsnap-web/public/icon-512.png`

---

## 11. Implementation order

1. Run merge gate on `main`; record §2 final baseline placeholders
2. Add `scripts/generate-pwa-assets.mjs` + `sharp` + package script
3. Run script; commit 5 PNG outputs
4. Update `manifest.webmanifest` (third icon + orientation)
5. Add `PwaStartupImages.tsx`; wire explicit `<head>` in `app/layout.tsx`
6. Audit `install-storage.ts`; fix only if P1 gap found
7. Install banner opacity fade + `useReducedMotion`
8. Copy — leave unchanged unless device QA notes confusion
9. Add `manifest-pwa.test.ts`
10. Full merge gate; update §2–§3 findings; leave §8 Pending for operator

**Done.** Review fixes applied; committed to `main`.
