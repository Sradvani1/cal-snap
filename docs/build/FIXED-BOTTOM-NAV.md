# FIXED-BOTTOM-NAV: Position: Fixed Tab Bar for iOS dvh Keyboard Jump Fix

**Status:** Implemented
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Fix a PWA UX bug where the bottom tab navigation bar jumps partway up the screen after the iOS virtual keyboard is dismissed. The nav appears to float mid-screen; a touch/scroll gesture snaps it back to the bottom.

---

## Root cause

The tab bar was an **in-flow flex footer** at the end of an `h-dvh` flex column. Its screen position depended on the CSS `dvh` (dynamic viewport height) unit. On iOS Safari/standalone PWA, `dvh` updates **asynchronously** during keyboard dismiss — the visual viewport returns to full height immediately, but `dvh` may lag by one or more frames. During this gap, the shell stays at the keyboard-open height, creating scrollable body space below the shell. The tab bar, attached to the shell bottom, floats mid-screen. A user touch triggers a `dvh` recomputation, snapping the layout back.

This is a documented WebKit defect with `dvh` transition timing.

---

## What shipped

| Area | Change |
|------|--------|
| Nav positioning | `shrink-0` (in-flow flex footer) → `fixed bottom-0 inset-x-0` (compositor-positioned, out-of-flow) |
| Nav height token | `tabBar.height` updated from `--app-tab-bar-content-height` to `--app-tab-bar-total-height` (includes safe area) |
| Main content padding | `<main>` gets `pb-[var(--app-tab-bar-total-height)]` to clear the now-fixed nav |
| CSS variable | `--app-tab-bar-total-height` added to `globals.css` — sums content row height + safe-area-bottom |
| Comments | `layout.ts` tab bar and content padding comments updated to match new architecture |
| Tests | `layout-safe-area.test.ts` assertions updated for new classes; new assertion for the CSS variable |

Files changed: **4** (no new files).

---

## Key decisions

1. **`position: fixed` over JavaScript `visualViewport` polyfill.** The browser compositor positions fixed elements relative to the viewport edge directly on the GPU compositing layer — no CSS layout pass, no `dvh` evaluation. This eliminates the timing bug at its architectural root rather than working around it with JavaScript viewport measurement.

2. **`position: fixed` over keeping in-flow with JS-driven `--app-viewport-height`.** The JS approach would require a new provider component (~30 lines), `useLayoutEffect`, `visualViewport.resize` subscriptions, and a CSS fallback for SSR. The fixed-positioning approach is zero JavaScript, 3 CSS class changes, and 1 CSS variable addition.

3. **Padding on `<main>`, not per-page.** There is exactly one scrollable container with the tab bar present — `<main>` in `(app)/layout.tsx`. Adding `pb-[var(--app-tab-bar-total-height)]` there covers all 5 tabs without touching any page component. The existing `layout.content.bottomPadding` (`pb-6`) remains on individual page content divs as breathing room — these are at a different nesting level and do not conflict.

4. **`pb-safe` retained on the nav.** With `fixed bottom-0`, `padding-bottom: var(--safe-area-bottom)` extends the nav's visual background behind the iPhone home indicator while pushing tab link content up above it. No change to safe-area handling.

5. **`--app-tab-bar-content-height` preserved alongside `--app-tab-bar-total-height`.** The content-only height (61px: 1px border + 44px min icon height + 16px vertical padding) is still useful for internal layout calculations. The total height variable adds the safe-area inset for the full visual footprint used by main content padding.

6. **`h-dvh` retained on `.app-shell`.** The shell's `h-dvh` may still lag during keyboard close, but the nav is now independently positioned by the compositor. The only artifact is a ~1-frame cosmetic gap between main content bottom and nav — imperceptible and not a regression over the prior behavior where the nav itself jumped.

---

## Architecture & data flow

```
Before (in-flow flex footer):
  .app-shell (h-dvh)
    ├─ InstallPromptBanner (optional)
    ├─ <main> (flex-1, scrollable)
    └─ <BottomTabNav> (shrink-0)  ◄── position depends on dvh resolution

After (fixed, compositor-positioned):
  .app-shell (h-dvh)
    ├─ InstallPromptBanner (optional)
    └─ <main> (flex-1, scrollable, pb-[var(--app-tab-bar-total-height)])
                                     ◄── cleared for fixed nav overlay
  <BottomTabNav> (fixed bottom-0, z-10)  ◄── compositor, immune to dvh timing
```

**CSS variable chain:**

```
globals.css
  --app-tab-bar-content-height  = calc(2.75rem + 1rem + 1px)  → 61px
  --app-tab-bar-total-height    = calc(var(--app-tab-bar-content-height)
                                   + var(--safe-area-bottom))  → 61px | 95px

layout.ts
  tabBar.nav    → 'fixed bottom-0 inset-x-0 z-10 border-t border-cs-border bg-cs-surface pb-safe'
  tabBar.height → 'var(--app-tab-bar-total-height)'

( app )/layout.tsx
  <main>  → pb-[var(--app-tab-bar-total-height)]  (Tailwind v4 arbitrary value)
```

**Compositor layers (post-change):**

```
Physical screen
┌─────────────────────────────────┐ ← top: 0
│ .app-shell (h-dvh)              │
│ ┌─────────────────────────────┐ │
│ │ <main> (flex-1, scrollable) │ │
│ │   page content...           │ │
│ │   ◄── padding-bottom ────► │ │ = var(--app-tab-bar-total-height)
│ └─────────────────────────────┘ │
└─────────────────────────────────┘ ← dvh bottom
┌─────────────────────────────────┐ ← compositor layer (z-10)
│ border-t ───────────────────── │
│ [Dashboard] [Log] [Scan] ...   │ ← tab icons (61px content)
│ bg-cs-surface continues        │ ← pb-safe (34px on notched)
└─────────────────────────────────┘ ← fixed bottom: 0
```

---

## Z-index layering

| Layer | z-index | Element |
|-------|---------|---------|
| `z-10` | Nav bar | Fixed tab bar — sits above scrollable content |
| `z-50` | Dialogs/sheets | Radix dialog overlay + content — covers nav when open |
| N/A | Main content | Default stacking — sits below nav |

Dialogs render via React portal (`DialogPortal` / Radix) to the end of `<body>`. The `z-50` overlay + content correctly covers the `z-10` fixed nav. Sheet-mode dialogs on mobile (`bottom-0`) do not conflict because the higher z-index wins.

---

## Test status

| Suite | Result |
|-------|--------|
| Unit (`vitest`, 45 files) | **242/242 passed** |
| `layout-safe-area.test.ts` | **7/7 passed** — updated assertions for `fixed`, `bottom-0`, `inset-x-0`, `not shrink-0`, new CSS variable |
| Lint (ESLint) | **clean** — zero warnings/errors |
| TypeScript (build) | **clean** — zero errors |
| Production build (`pnpm build`) | **success** — Next.js 16.2.9 + Serwist PWA |

---

## Next-phase context / notes

- **`h-dvh` on `.app-shell` could still be replaced with `h-full`** for complete `dvh` independence. This would require verifying the `flex-1` layout still resolves correctly with `height: 100%` (derived from body → html → viewport). The current nav fix is sufficient; the shell height lag is cosmetic only.
- **Onboarding layout still uses `min-h-dvh`** and may exhibit the same cosmetic gap after keyboard close. No tab bar is present on onboarding, so the user impact is a brief blank area at the page bottom rather than a jumped nav. This is lower priority.
- **`body { overflow-x: hidden }`** (not `overflow: hidden`) — body-level scroll is still possible if a descendant forces body growth. The fixed nav is independent of body scroll. If future layout work introduces body-level scrolling, the nav stays pinned regardless.
- **The `pb-safe` class on the fixed nav extends `padding-bottom`**. This is the element's internal padding — with `position: fixed; bottom: 0`, the content box sits above the padding, so the tab links are correctly positioned above the home indicator. The `bg-cs-surface` background fills the padding area behind the indicator.
- **Tab bar width on tablets**: `<nav>` has `inset-x-0` (full width), inner `<ul>` has `max-w-lg mx-auto` (centered, max 512px). Tab icons stay constrained on wide screens while the nav background spans edge-to-edge.

---

## Files changed

**Modified:**
- `calsnap-web/app/globals.css` — added `--app-tab-bar-total-height` CSS variable
- `calsnap-web/lib/design/layout.ts` — `tabBar.nav` class, `tabBar.height` value, comments
- `calsnap-web/app/(app)/layout.tsx` — added `pb-[var(--app-tab-bar-total-height)]` to `<main>`
- `calsnap-web/tests/unit/layout-safe-area.test.ts` — updated assertions
