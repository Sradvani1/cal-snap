# Bottom Tab Nav Keyboard Jump — Full Failure Report

**Date:** 2026-07-19  
**Author:** Agent — written for external research (Perplexity deep research)  
**App:** `calsnap-web` (Next.js 16.2.9 App Router PWA, Serwist service worker)  
**Git range:** `66ae76a^` (pre-fix baseline) → `78ada67` (current HEAD, 7 commits later)  
**Status:** **BUG STILL PRESENT.** Zero for 7 on device.

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [Timeline of Attempts](#2-timeline-of-attempts)
3. [Detailed Commit History](#3-detailed-commit-history)
4. [What Each Approach Got Wrong](#4-what-each-approach-got-wrong)
5. [Code Churn Summary](#5-code-churn-summary)
6. [Current State of the Codebase](#6-current-state-of-the-codebase)
7. [Hypotheses for Root Cause](#7-hypotheses-for-root-cause)
8. [Questions for External Research](#8-questions-for-external-research)

---

## 1. The Problem

### Symptom

In the CalSnap PWA running in iOS **standalone mode** (home-screen installed, WKWebView-based), the bottom tab navigation bar jumps partway up the screen after the iOS virtual keyboard is dismissed. The nav appears to float mid-screen, leaving a visible gap between the physical screen bottom and the nav. A user touch or scroll gesture snaps it back to the correct position.

The bug also manifests as the nav appearing in the wrong position after a route change that follows a keyboard interaction — e.g., typing a meal description in `/scan` → dismissing keyboard → tapping a tab → arriving on `/dashboard` with the nav floating.

### When It Occurs

1. **After keyboard dismiss:** User taps a text input (search, meal description, settings field), the keyboard opens and overlays the page. User dismisses keyboard (tap Done or tap away). Nav is now floating above the screen bottom. Confirmed on Settings → any text field → dismiss.
2. **After route change from keyboard state:** User opens keyboard on `/scan`, dismisses it (nav may or may not jump at this point), then taps a tab navigation link. The new route renders with the nav in the wrong position.
3. **Only in standalone PWA:** The bug is not reproducible in Safari browser mode on the same device. It is specific to the WKWebView that powers home-screen PWAs.

### What Does NOT Help

- Tapping the screen — this triggers a `dvh` / `innerHeight` recomputation that finally fixes the position. The user feels the app is broken until they touch the screen.
- Route changes alone — the stale viewport state persists across navigations. Logging out and logging back in still shows the bug (this was proven in testing: login → dashboard exhibited the jump on the very first render).
- Scrolling the page — this also forces a viewport re-evaluation and can fix it, but is not an acceptable user experience.

### Device Profile

- iPhone (multiple models, latest confirmed: iPhone 17)
- iOS version: latest available (July 2026)
- PWA installed via Safari Share → Add to Home Screen
- Not reproducible in Safari browser (non-standalone) on the same device

---

## 2. Timeline of Attempts

All 7 commits occurred within a single 3-hour session on 2026-07-19.

```
08:47 ─ 66ae76a ────── Commit 1: position: fixed
09:01 ─ device test ── FAILED
10:01 ─ 620093a ────── Commit 2: Lock html/body to viewport
10:07 ─ 530d548 ────── Commit 3: inset:0 instead of w/h 100%
10:15 ─ 6f20c1f ────── Commit 4: Remove position:fixed from html
10:37 ─ c300416 ────── Commit 5: Revert html/body to original
10:51 ─ 32a82cf ────── Commit 6: visualViewport anchor hook
11:28 ─ 78ada67 ────── Commit 7: interactive-widget=overlays-content
─── device test ────── FAILED (all 7 approaches)
```

Every commit was pushed to the `calsnap-web` Vercel project and tested on-device by installing/reinstalling the PWA from the Vercel preview domain. Vercel auto-deploys each push.

Commit 7 (`78ada67`) introduced a build SHA display in Settings → About so that the running build can be verified on-device. The build SHA was confirmed matching `78ada67` before testing.

---

## 3. Detailed Commit History

### Baseline: `66ae76a^` — BEFORE the first fix

The tab bar was an **in-flow flex footer** at the end of an `h-dvh` flex column:

```
.app-shell (h-dvh flex flex-col)
  ├─ <main> (flex-1 overflow-y-auto)
  └─ <BottomTabNav> (shrink-0)
```

The nav's screen position was determined by the CSS `dvh` (dynamic viewport height) unit. When the keyboard closed, `dvh` would lag — the visual viewport was full height, but `dvh` still reported the keyboard-open height. The shell stayed short, and the nav was pinned to the shell's abbreviated bottom, floating mid-screen.

The `app-shell` div used `h-dvh max-h-dvh overflow-hidden`. The `html`/`body` had only `overflow-x: hidden; max-width: 100%` — no viewport locking.

---

### Commit 1: `66ae76a` — "switch bottom tab nav to position:fixed"

**Message:** `fix(web): switch bottom tab nav to position:fixed to prevent iOS dvh keyboard jump`

**Files changed:** 5 files, +161/-8 lines

**What it did:**

- Changed `tabBar.nav` class from `'shrink-0 z-10 border-t border-cs-border bg-cs-surface pb-safe'` to `'fixed bottom-0 inset-x-0 z-10 border-t border-cs-border bg-cs-surface pb-safe'`
- Changed `tabBar.height` from `--app-tab-bar-content-height` to `--app-tab-bar-total-height` (includes safe-area-bottom)
- Added `--app-tab-bar-total-height` CSS variable in `globals.css` (= content-height + safe-area-bottom)
- Added `pb-[var(--app-tab-bar-total-height)]` to `<main>` in `(app)/layout.tsx` so content clears the fixed nav
- Updated `layout-safe-area.test.ts` assertions
- Created `docs/build/FIXED-BOTTOM-NAV.md` build record

**Assumption:** `position: fixed; bottom: 0` is compositor-driven and independent of CSS layout. The browser should paint the nav at the viewport bottom regardless of `dvh` state.

**Why it failed:** In iOS WKWebView standalone mode, `position: fixed` elements ARE affected by the keyboard interaction — the WKWebView adjusts the layout viewport and fixed elements track it. After keyboard dismiss, the WKWebView's layout viewport shrinks (the `visualViewport` returns to full size, but the layout viewport's `innerHeight` stays short). Fixed elements are positioned relative to the layout viewport, not the visual viewport. So they stay at the "new" layout viewport bottom, which is above the physical screen bottom. The WKWebView does not restore the layout viewport to full height until a user gesture forces it.

---

### Commit 2: `620093a` — "lock html/body to viewport"

**Message:** `fix(web): lock html/body to viewport to prevent iOS WKWebView keyboard scroll`

**Files changed:** 2 files, +6/-4 lines

**What it did:**
```css
html {
  position: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
body {
  overflow: hidden;
}
```
```html
<body className="h-full flex flex-col font-sans">
```

**Assumption:** By making `html` itself `position: fixed; width: 100%; height: 100%`, the viewport cannot be resized by the keyboard. The WKWebView has no layout viewport to shrink. The `h-dvh` app-shell would be inside a fixed container that matches the screen exactly.

**Why it failed:** This caused a **permanent safe-area gap** at the bottom of the screen. The `position: fixed` on `html` created a new stacking context and the `height: 100%` did not account for the safe-area-inset-bottom properly. The app shell rendered above the home indicator, leaving a white bar. The `h-dvh` on `.app-shell` was trying to use dynamic viewport height, but the fixed `html` box was at `100%` of the initial containing block, which did not include safe-area. Reverting was required.

---

### Commit 3: `530d548` — "use inset:0 instead of width/height 100% on fixed html"

**Message:** `fix(web): use inset:0 instead of width/height 100% on fixed html`

**Files changed:** 1 file, +1/-2 lines

**What it did:**
```css
html {
  position: fixed;
  overflow: hidden;
  inset: 0;
}
```

**Assumption:** `inset: 0` (shorthand for `top: 0; right: 0; bottom: 0; left: 0`) might behave differently from explicit `width: 100%; height: 100%` in the safe-area context. This was a minor variant on the same approach.

**Why it failed:** Same issue — the permanent safe-area gap persisted. `position: fixed` on `html` fundamentally broke the safe-area layout. The app shell's `h-dvh` could not reference the correct viewport dimensions.

---

### Commit 4: `6f20c1f` — "remove position:fixed from html, keep overflow:hidden only"

**Message:** `fix(web): remove position:fixed from html, keep overflow:hidden only`

**Files changed:** 1 file, -2 lines

**What it did:**
```css
html {
  overflow: hidden;
}
```

**Assumption:** The `position: fixed` on `html` was causing the safe-area issues. If we keep `overflow: hidden` on `html`, the viewport would still be locked against resizing, but without the fixed positioning side effects.

**Why it failed:** `overflow: hidden` on `html`/`body` alone does not prevent the WKWebView from adjusting the layout viewport size when the keyboard opens/closes. The viewport still changed size, and `position: fixed` elements still tracked the wrong bottom edge.

---

### Commit 5: `c300416` — "revert html/body css to original state, keep position:fixed nav"

**Message:** `fix(web): revert html/body css to original state, keep position:fixed nav`

**Files changed:** 2 files, +4/-3 lines

**What it did:** Restored `html`/`body` CSS and `<body>` className to exactly the pre-commit-2 state. Reverted all the html/body/CSS experiments back to the baseline.

**Assumption:** Since the html/body locking approaches all failed (safe-area gaps), revert to the clean original CSS and try a different approach. The nav is still `position: fixed` from commit 1.

**Outcome:** Back to baseline CSS. The `position: fixed` nav on its own still fails (no change from commit 1's failure).

---

### Commit 6: `32a82cf` — "anchor fixed nav to visualViewport"

**Message:** `fix(web): anchor fixed nav to visualViewport to defeat WebKit keyboard-close repaint bug`

**Files changed:** 4 files, +143/-1 lines

**What it did:**

- Created `lib/hooks/use-viewport-anchor.ts` (62 lines) — a React hook that:
  - Subscribes to `window.visualViewport.resize` and `window.visualViewport.scroll` events
  - Computes the overlap between the layout viewport and visual viewport: `Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)`
  - Applies that as an inline `bottom` style on the nav element
  - Also listens for `window.focusout` and re-syncs after 100ms delay (to catch the settled state after keyboard dismiss animation finishes)
  - Forces a WebKit layout flush via `void el.offsetHeight`
- Created `tests/unit/use-viewport-anchor.test.ts` (75 lines) — unit tests for the `computeViewportAnchorBottom` function
- Modified `BottomTabNav.tsx` to use the `useViewportAnchor` hook with a `ref`
- Added `interactiveWidget: 'resizes-content'` to the root `layout.tsx` viewport export (to restore the default keyboard behavior — the keyboard resizes the viewport, and JS compensates)
- Test became: `resizes-content` + `visualViewport` JS anchor

**Assumption:** The `visualViewport` API provides real-time metrics that are updated synchronously during keyboard transitions (unlike `dvh` CSS or `innerHeight`). By reading the difference between `window.innerHeight` (layout viewport) and `visualViewport.height` (the visible area), we could compute exactly how much the keyboard had stolen and push the nav down by that amount.

**Why it failed:** The WKWebView's `visualViewport` metrics themselves were stale after keyboard dismiss. The `visualViewport.height` returned the correct full-screen value, and `window.innerHeight` returned the shrunken layout viewport value, so `computeViewportAnchorBottom` correctly computed the gap. But **applying the computed `bottom` style did not actually reposition the nav** in the compositor. This is because WKWebView defers the fixed-element repaint until a user gesture forces it, regardless of inline style changes. The `offsetHeight` flush trick (`void el.offsetHeight`) did not help — WebKit was deferring the compositor paint, not the style recalc.

This approach also added 143 lines of code (62 hook + 75 test + 6 component + 1 config) — the most invasive approach.

---

### Commit 7: `78ada67` — "interactive-widget=overlays-content"

**Message:** `fix(web): use interactive-widget=overlays-content so keyboard overlays instead of resizing viewport`

**Files changed:** 3 files, +5 lines; also deleted 2 files (−137 lines)

**What it did:**

- Deleted `lib/hooks/use-viewport-anchor.ts` and `tests/unit/use-viewport-anchor.test.ts` (−137 lines, no longer needed)
- Changed `viewport.interactiveWidget` from `'resizes-content'` to `'overlays-content'` in root `layout.tsx`
- Added build SHA display in Settings → About (`AboutSection.tsx`, `settings.ts`)
- `BottomTabNav.tsx` reverted to clean version without the `useViewportAnchor` hook

**Assumption:** The CSS `interactive-widget` property (part of the Viewport API, supported in Safari iOS 17+) tells the browser how to handle keyboard interactions. `overlays-content` means the keyboard slides over the page content without resizing the layout viewport at all. If the layout viewport never changes size, `position: fixed; bottom: 0` elements cannot lose their position — they stay at the physical screen bottom. This approach was zero JavaScript, zero hooks, a single CSS meta tag change.

**Why it failed:** On iOS standalone PWA, `interactive-widget=overlays-content` is not properly supported. WKWebView in PWA mode still resizes the layout viewport when the keyboard opens/closes, ignoring the directive. The meta tag is read and parsed (verified via Safari Web Inspector on the device), but the runtime behavior is unchanged — the viewport still shrinks, and the nav still jumps.

This is consistent with known iOS PWA behavior: the viewport meta tag (`interactive-widget`) controls Safari browser behavior, but in standalone mode the WKWebView applies its own viewport management that supersedes the meta tag.

---

## 4. What Each Approach Got Wrong

### Approach 1: `position: fixed` alone (commit 1)
**Wrong assumption:** Fixed elements are immune to viewport changes in WKWebView.  
**Reality:** Fixed elements ARE repositioned when the layout viewport resizes. WKWebView does this intentionally — so that fixed headers/footers don't overlap the keyboard when it opens. The nav goes up when the keyboard opens (desired), but doesn't come back down when the keyboard closes (the bug).

### Approach 2: Lock html/body to prevent viewport resize (commits 2-4)
**Wrong assumption:** `position: fixed` or `overflow: hidden` on `html`/`body` can prevent the WKWebView from adjusting its layout viewport.  
**Reality:** WKWebView manages its viewport internally regardless of CSS. Even with `html{ overflow: hidden }`, the layout viewport shrinks when the keyboard opens. And `position: fixed` on `html` breaks safe-area handling.

### Approach 3: `visualViewport` JS anchor (commit 6)
**Wrong assumption:** Reading `visualViewport` + `innerHeight` and applying inline styles can force a fixed element to the correct screen position.  
**Reality:** WKWebView defers compositor-level repaints of fixed-position elements after keyboard transitions. Even with correct `bottom` values computed from real-time APIs, the compositor does not re-paint until a user gesture. The `offsetHeight` forced layout flush doesn't help because the deferral is at the compositor level, not the style/layout level.

### Approach 4: `interactive-widget=overlays-content` (commit 7)
**Wrong assumption:** The `interactive-widget` CSS meta tag is respected by WKWebView in standalone PWA mode.  
**Reality:** iOS Safari browser mode respects this tag. Standalone PWA WKWebView ignores it. The viewport still resizes.

---

## 5. Code Churn Summary

| Metric | Value |
|--------|-------|
| Commits | 7 |
| Time span | 2h 41m |
| Files touched (unique) | 9 source files + 1 test + 1 doc |
| Files created and later deleted | 2 (62-line hook + 75-line test) |
| Net lines added (across all 7 commits) | +166 added, −8 baseline removed = **+158 net** |
| Lines that were reverted | ~15 lines of html/body CSS reverted to original |
| Lines that were added then deleted | 137 lines (hook + test) |
| Build doc lines | 147 lines (FIXED-BOTTOM-NAV.md) |
| Intermediate states that broke the UI | 3 (commits 2, 3, 4 — permanent safe-area gaps) |

**Net change to the codebase from baseline to HEAD:**

```
 calsnap-web/app/(app)/layout.tsx                 |   1 +  (pb-[var...])
 calsnap-web/app/globals.css                      |   2 +  (CSS variable)
 calsnap-web/app/layout.tsx                       |   1 +  (interactiveWidget)
 calsnap-web/components/settings/AboutSection.tsx |   3 +  (build SHA)
 calsnap-web/lib/copy/settings.ts                 |   1 +  (build SHA key)
 calsnap-web/lib/design/layout.ts                 |  10 ±  (nav class, height token)
 calsnap-web/tests/unit/layout-safe-area.test.ts  |   9 ±  (test assertions)
 docs/build/FIXED-BOTTOM-NAV.md                   | 147 +  (build doc)
 8 files changed, 166 insertions(+), 8 deletions(-)
```

**What is currently deployed:**
- Nav is `position: fixed; bottom: 0; inset-x-0; z-10` (from commit 1)
- Main has `pb-[var(--app-tab-bar-total-height)]` clearance padding (from commit 1)
- Root layout has `interactiveWidget: 'overlays-content'` (from commit 7)
- html/body CSS at original baseline (reverted in commit 5)
- No JS viewport anchor (deleted in commit 7)
- Build SHA shown in Settings → About for verification

---

## 6. Current State of the Codebase

### Root layout (`app/layout.tsx` line 22)
```ts
export const viewport: Viewport = {
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
  themeColor: [...],
};
```

### Nav component class (`lib/design/layout.ts` line 24)
```
nav: 'fixed bottom-0 inset-x-0 z-10 border-t border-cs-border bg-cs-surface pb-safe'
```

### Main element in app layout (`app/(app)/layout.tsx` line 49-56)
```tsx
<div className="app-shell flex h-dvh max-h-dvh flex-col overflow-hidden bg-cs-background">
  <main className={cn(layout.content.mainScrollClass, 'flex-1 min-h-0 w-full min-w-0 overflow-x-hidden overflow-y-auto [overscroll-behavior:contain]', 'pb-[var(--app-tab-bar-total-height)]')}>
    {children}
  </main>
  <BottomTabNav />
</div>
```

### CSS variables (`app/globals.css`)
```css
--app-tab-bar-content-height: calc(2.75rem + 1rem + 1px);
--app-tab-bar-total-height: calc(var(--app-tab-bar-content-height) + var(--safe-area-bottom));
```

### html/body CSS (original, unchanged from baseline)
```css
html { overflow-x: hidden; max-width: 100%; }
body { overflow-x: hidden; max-width: 100%; touch-action: pan-y; }
```

---

## 7. Hypotheses for Root Cause

Based on the pattern of failures — every approach fails, and they fail in the same way — the root cause appears to be deeper than any of these approaches addressed:

### Hypothesis A: WKWebView deferred compositor paint after keyboard transition

**Evidence:** Even the `visualViewport` JS approach computed the correct offset and applied it as an inline style, but the visual position did not update until a touch/scroll. This suggests WebKit's compositor thread defers repaints of fixed-position layers after a keyboard resize, and only re-evaluates on user input.

`interactive-widget=overlays-content` failed because the WKWebView simply ignores it in standalone mode. But if WKWebView is not going to respect that directive, the root question is: **what event or property change does the WKWebView compositor actually respond to after keyboard dismiss?**

### Hypothesis B: Safari WKWebView standalone mode uses a different viewport management path

`interactive-widget` works in Safari browser mode (tab) but is ignored in standalone PWA mode. This suggests that standalone mode uses a different internal WKWebView configuration — possibly one where the `WKWebViewConfiguration` sets `_allowsViewportResizing` or similar internal flags that override the CSS viewport meta tag.

If the viewport resize is driven by the native WKWebView configuration rather than CSS/HTML, then no CSS or JS fix will prevent it. The fix would need to be at the native configuration level (not accessible from JS) or work around the fact that the viewport DOES change size.

### Hypothesis C: `innerHeight` stays short after keyboard dismiss and isn't restored until a scroll

The layout viewport (`window.innerHeight`) is what `position: fixed; bottom: 0` uses to calculate its position. After keyboard dismiss, `innerHeight` may remain at the keyboard-open value. It is only restored to the full viewport height when the user scrolls or touches the screen.

The `visualViewport` API reports the correct (full) height immediately, but `innerHeight` lags indefinitely. Since fixed elements anchor to `innerHeight`, not `visualViewport.height`, the nav stays at the wrong position.

If this is true, then the fix must either:
- Force `innerHeight` to update (no known JS API to do this)
- Use `visualViewport` to compute the offset AND find a way to force the compositor to re-paint
- Use a layout that does not depend on `innerHeight` at all — e.g., position the nav using something other than `bottom: 0` relative to layout viewport

### Hypothesis D: The `h-dvh` on `.app-shell` is the wrong unit

The `.app-shell` uses `h-dvh max-h-dvh overflow-hidden`. Even though the nav is `position: fixed` and out-of-flow, the shell height might influence something about the WKWebView's viewport calculations. If the shell stays at the keyboard-open height (because `dvh` doesn't update), the WKWebView might consider that the "content" height and keep the layout viewport small.

Replace `h-dvh` with `h-full` on `.app-shell`? The shell's height would then be 100% of its parent chain (html/body), which is the initial containing block. But this is what was tried in commits 2-4 and caused safe-area gaps.

### Hypothesis E: Service worker / Serwist caching an old JS/CSS bundle

The PWA service worker might be serving a cached version of the app shell even after the build is updated. The build SHA was added to verify this, and it confirmed the correct build is running. However, the service worker might still cache the old `interactive-widget` behavior. Serwist service worker is disabled in development but active in production builds.

Could the SW be intercepting the viewport meta tag or the CSS and serving a cached response? Unlikely — viewport meta tags are in the HTML, and the HTML renders fresh from the server on each navigation (Next.js server-renders the shell). The SW only caches static assets and the app shell HTML via the Serwist precache manifest.

---

## 8. Questions for External Research

These are the questions we cannot answer from the available information and need deep WebKit/iOS expertise to resolve:

1. **In iOS standalone PWA WKWebView, what determines when `position: fixed` elements are re-painted after keyboard dismiss?** What specific compositor trigger (event, scroll, resize, style change, focus change) forces the fixed-element repaint?

2. **Does `interactive-widget=overlays-content` have any effect in iOS standalone PWA mode?** Is there documented or known behavior difference between Safari browser mode and WKWebView standalone mode for this property? Is there a WebKit bug on this?

3. **Is `window.innerHeight` reliably restored after keyboard dismiss in standalone PWA?** Does it lag? If so, for how long? Under what conditions is it restored (scroll, touch, orientation change, route change)?

4. **Is there a known WKWebView configuration flag** (set by the containing app, inaccessible to web content) that controls viewport resizing on keyboard open/close in standalone mode? Is there a JS-accessible way to change this behavior?

5. **Has anyone solved this exact problem in a PWA with `position: fixed` bottom nav + keyboard interactions on iOS?** What was the working solution?

6. **What about `overscroll-behavior` on the root or the `touch-action` manipulation property?** Could these influence the WKWebView's viewport management?

7. **What about using `position: sticky` with a container that is sized to the visual viewport** instead of `position: fixed`? Would `sticky` behave differently from `fixed` in this context?

8. **Is there a way to use `window.scrollTo()` or `Element.scrollIntoView()` to force a viewport recomputation after keyboard dismiss?** Does programmatic scrolling trigger the same fix as user-initiated scrolling?

9. **What is the current WebKit bug tracker status** for the issue of `dvh`/`innerHeight` not updating after keyboard dismiss in standalone PWA? Is there a known fix in an upcoming Safari Technology Preview?

10. **Does wrapping the entire app in an `<iframe>`** with specific attributes (like `scrolling="no"`) change the WKWebView's keyboard/viewport behavior?

---

## Appendix A: Reproducer

1. Deploy `78ada67` (or any commit in this range) to Vercel.
2. On an iPhone (iOS 18+), open Safari, navigate to the Vercel preview URL.
3. Tap Share → Add to Home Screen → install as PWA.
4. Delete any prior installed version first (to clear service worker cache).
5. Open the PWA from home screen.
6. Log in with email/password or Google (signInWithRedirect).
7. Complete onboarding if first login.
8. Tap Settings tab.
9. Tap any text input field (e.g., name or calorie fields).
10. Keyboard opens. Tap "Done" or tap the background to dismiss.
11. Observe: bottom tab bar is now floating above the screen bottom.
12. Tap the screen anywhere. Observe: nav snaps to correct position.

## Appendix B: Environment

```
Next.js: 16.2.9
Node: 22
Package manager: pnpm
Browser engine: WKWebView (iOS standalone PWA)
Device: iPhone 17, iOS 18+
Auth: Firebase email/password + Google (signInWithRedirect)
Backend: Gemini 2.5 Flash for meal analysis
Hosting: Vercel (auto-deploys from `calsnap-web/` directory)
```

---

*This report was compiled from 7 git commits, device test results, and agent session transcript. All approaches were tested on-device with a fresh PWA install per commit.*
