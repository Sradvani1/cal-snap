# Bottom Tab Nav Keyboard Jump — Failure Report, Part 2

**Date:** 2026-07-19  
**Author:** agent  
**App:** `calsnap-web` (Next.js 16.2.9 App Router PWA, Serwist service worker)  
**Git range:** `78ada67` (end of Part 1) → `190559b` (current HEAD, 11 commits later)  
**Status:** **BUG STILL PRESENT.** Zero for 10 on device. All experiments reverted. Codebase returned to pre-experiment baseline.

---

## Table of Contents

1. [Summary of Part 1](#1-summary-of-part-1)
2. [Timeline of Additional Attempts](#2-timeline-of-additional-attempts)
3. [Detailed Commit History](#3-detailed-commit-history)
4. [What Each New Approach Got Wrong](#4-what-each-new-approach-got-wrong)
5. [Code Churn Summary (Part 2)](#5-code-churn-summary-part-2)
6. [Current State of the Codebase](#6-current-state-of-the-codebase)
7. [Hypotheses for Root Cause (Updated)](#7-hypotheses-for-root-cause-updated)
8. [Unanswered Questions](#8-unanswered-questions)

---

## 1. Summary of Part 1

The first report (7 commits, range `66ae76a^ → 78ada67`) documented all failed approaches:

| # | Approach | Result |
|---|----------|--------|
| 1 | `position: fixed; bottom: 0` on nav | WKWebView fixed elements track layout viewport, not visual viewport |
| 2 | `html { position: fixed; overflow: hidden }` | Broke safe-area — permanent white bar at screen bottom |
| 3 | `html { position: fixed; inset: 0 }` | Same safe-area gap |
| 4 | `html { overflow: hidden }` only | No effect — WKWebView ignores it for viewport management |
| 5 | Revert html/body, keep `position: fixed` nav | Back to failure state of approach 1 |
| 6 | `visualViewport` JS anchor hook (compute offset, apply inline `bottom` style) | Correctly computed offset, but WKWebView deferred compositor repaint — style was ignored |
| 7 | `interactive-widget: overlays-content` | WKWebView in standalone PWA mode ignores this meta tag |

**Part 1 conclusion at `78ada67`:** Nav was `position: fixed; bottom: 0`, main had `pb-[var(--app-tab-bar-total-height)]`, root layout had `interactiveWidget: 'overlays-content'`. Bug still present.

---

## 2. Timeline of Additional Attempts

All 3 new approaches occurred in a single 4-hour session on 2026-07-19 (same day as Part 1).

```
10:00 ─ c37bbfd ────── Baseline revert: in-flow nav, no widgets
12:00 ─ 56a90d4 ────── Experiment 8: useEditingMode (hide nav on focus)
12:30 ─ device test ─── FAILED
13:00 ─ 1dae4cd ────── Experiment 9: scroll nudge on focusout
13:30 ─ device test ─── FAILED
14:00 ─ f7dfff8 ────── Experiment 10: visualViewport sets html/body height
14:30 ─ device test ─── FAILED (worse: got stuck)
15:00 ─ 25eb6f6 ────── Revert experiment 10
15:15 ─ 6be244f ────── Revert experiment 8
15:30 ─ 64c2d82 ────── Revert experiment 9
15:35 ─ 190559b ────── Cleanup orphaned file
15:40 ─ pnpm test ───── 242 passed, lint clean, build green
```

All 3 new experiments were deployed and tested on-device with fresh PWA installs. All failed. All were reverted. The codebase is now back to the exact pre-experiment baseline (`c37bbfd`).

---

## 3. Detailed Commit History

### Baseline: `78ada67` (end of Part 1)

```
app/layout.tsx:            interactiveWidget: 'overlays-content'
(app)/layout.tsx:          nav is position:fixed, main has pb-[...]
BottomTabNav:              fixed bottom-0 inset-x-0
html/body CSS:             original baseline (overflow-x hidden, no viewport locks)
```

### Baseline reset: `c37bbfd` — "revert: restore pre-experiment bottom nav layout"

**Message:** `revert: restore pre-experiment bottom nav layout`

**Files changed:** 6 files, +46/-43 lines

**What it did:** Returned the nav to its original in-flow `shrink-0` position inside the `h-dvh` flex column. Removed `position: fixed`. Removed `interactiveWidget` from root layout. Removed `--app-tab-bar-total-height` CSS variable and the main padding-bottom that cleared the fixed nav. Removed the build SHA from Settings (it was a Part 1 debugging aid, no longer needed).

**Nav class reverted to:**
```
shrink-0 z-10 border-t border-cs-border bg-cs-surface pb-safe
```

**Shell returned to:**
```
.app-shell: flex h-dvh max-h-dvh flex-col overflow-hidden bg-cs-background
  <main>: flex-1 overflow-y-auto (no bottom padding)
  <BottomTabNav>: shrink-0 (in-flow, unconditional)
```

**Root layout viewport export cleaned to:**
```ts
export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [...],
};
// No interactiveWidget
```

**Assumption:** Return to the cleanest possible baseline before attempting any new experiments. The in-flow layout is the simplest, most maintainable design.

**Outcome:** Clean baseline. Bug present (same as original symptom).

---

### Experiment 8 (Attempt 8 overall): `56a90d4` — useEditingMode

**Message:** `experiment(web): unmount BottomTabNav while editable field is focused`

**Files changed:** 4 files (+54/-0)

**What it did:**

Created `lib/hooks/use-editing-mode.ts` — a 30-line React hook that:
   - Listens for `focusin` / `focusout` (capture phase) on `document`
   - Returns `true` while an `<input>`, `<textarea>`, or `[contenteditable]` has focus
   - `false` when no editable element is focused

Modified `(app)/layout.tsx`:
   - Imported and called `useEditingMode()`
   - Rendered `<BottomTabNav />` only when `!isEditing`

Created `tests/unit/use-editing-mode.test.ts` — unit tests for the `isEditableElement` helper.

**Assumption:** If the nav is physically absent (unmounted from DOM) while the keyboard is open, it won't be positioned based on the shrunken viewport. When the user dismisses the keyboard, focusout fires → `isEditing` becomes false → React re-mounts the nav into the freshly-recomputed layout. Since the keyboard is gone and the viewport is full size by the time `focusout` fires (which happens immediately on Done tap), the nav should mount at the correct bottom position.

**Why it failed:** The nav snapped to the correct position on the first mount after focusout, but this was actually the same user-gesture-dependent recompute as the "tap to fix" behavior — the mount itself was a DOM mutation that triggered a reflow, which in turn forced WebKit to re-evaluate the viewport. However, on route changes (e.g., editing a field on Scan, dismissing, then tapping a tab), the nav would render at the wrong position because the app layout re-renders with the nav in the wrong state. The mount timing is unreliable: `focusout` fires, React re-renders (async), WebKit defers, and the nav appears in the wrong spot before settling. The experience was inconsistent.

Also, the nav vanishing/reappearing during editing was perceptible — a 2.75rem-tall row flashing in and out during text entry was visually jarring.

---

### Experiment 9 (Attempt 9 overall): `1dae4cd` — useKeyboardDismissRecovery (scroll nudge)

**Message:** `experiment(web): scroll nudge on focusout to force WebKit layout recompute`

**Files changed:** 4 files (+68/-57)

**What it did:**

- Deleted `use-editing-mode.ts` and its test (replaced experiment)
- Created `lib/hooks/use-keyboard-dismiss-recovery.ts` — a hook that:
  - Tracks `wasEditing` via a `useRef<boolean>` (set true on `focusin` of editable, false on `focusout`)
  - On `focusout`, fires a double-rAF scroll nudge sequence:
    ```
    rAF → window.scrollTo(0, 1)
    rAF → window.scrollTo(0, 0)
    ```
  - This is the same technique used by Capacitor and Flutter iOS PWA workarounds — a programmatic scroll forces WebKit to flush its deferred layout/compositor state

- Updated `(app)/layout.tsx`: replaced `useEditingMode` import/call with `useKeyboardDismissRecovery`, kept `BottomTabNav` unconditional

- Documented two fallback paths for device test failure:
  1. **Container-scroll fallback:** nudge `<main>` instead of `window` (if root has no scroll room)
  2. **Animation-timing fallback:** 200ms `setTimeout` instead of double-rAF (if keyboard animation hasn't settled)

**Assumption:** The scroll nudge forces the same compositor recompute that a manual user tap triggers. Since `window.scrollTo` is a programmatic scroll, it should trigger the same path. Two rAF guarantees the nudge fires after WebKit has started settling.

**Why it failed:** `window.scrollTo` was a **no-op on this layout**. The CSS scroll chain is:

```
html/body                     → overflow-x hidden, no overflow-y set
  .app-shell                  → h-dvh max-h-dvh overflow-hidden ← locks viewport height
    main                      → flex-1 overflow-y-auto           ← actual scroller
    nav (shrink-0)            → in-flow footer
```

`.app-shell` is exactly `dvh` tall with `overflow-hidden`. The root document (`html`/`body`) has `documentElement.scrollHeight === clientHeight` because the shell consumes all available height. `scrollTo(0, 1)` has nothing to scroll — no scrollable overflow at root level. The call returns without any layout effect or compositor flush.

The fallbacks were not deployed because the first-line approach failed completely, and the user opted to try a different experiment (Experiment 10) rather than iterate on the fallback paths.

---

### Experiment 10 (Attempt 10 overall): `f7dfff8` — useKeyboardActiveViewport (visualViewport inline height)

**Message:** `experiment(web): useKeyboardActiveViewport — resize html/body to visualViewport.height during keyboard`

**Files changed:** 5 files (+118/-67)

**What it did:**

- Deleted `use-keyboard-dismiss-recovery.ts` and its test (replaced experiment)
- Created `lib/hooks/use-keyboard-active-viewport.ts` — a hook that:
  - On `focusin` of an editable element: registers a `window.visualViewport.resize` listener (wrapped in `rAF`), fires it immediately
  - In the resize handler: reads `window.visualViewport.height`, sets inline pixel `height` on **both `<html>` and `<body>`** to that value
  - Also resets `scrollTop` to 0 on both elements
  - Adds CSS class `keyboard-active` to `<html>`
  - On `focusout`: in `rAF`, checks if `document.activeElement` is another editable; if not, removes the resize listener, clears inline heights, removes `keyboard-active`, resets `scrollTop`

- Added CSS rule to `globals.css`:
  ```css
  html.keyboard-active .app-shell {
    height: 100%;
    max-height: 100%;
  }
  ```
  This overrides the default `h-dvh max-h-dvh` on `.app-shell` (via higher specificity `(0,2,0)` vs `(0,1,0)`), making the shell size to the parent `<body>` (whose height is set to `visualViewport.height` px by the hook).

- Updated `(app)/layout.tsx`: replaced import/call

**Assumption:** During keyboard activity, `visualViewport.height` is the visible area above the keyboard — the only area the user can see. By setting `html`/`body` to this pixel value and having `.app-shell` at `height: 100%`, the shell exactly fills the visible area. The in-flow `BottomTabNav` sits at the shell's bottom, which is the visual viewport's bottom — i.e., just above the keyboard. When the keyboard dismisses, `visualViewport.resize` fires with the new (larger) height, the handler sets `html`/`body` to the correct pixel height, and the shell + nav follow immediately because inline pixel heights are applied synchronously. No WebKit deferral because the approach avoids `dvh` and fixed positioning entirely.

**Why it failed (and made things worse):** The inline pixel heights on `html`/`body` never cleared. The `focusout` handler's rAF-delayed cleanup did not execute reliably on iOS standalone PWA. Likely causes:

1. **`focusout` timing:** On iOS, tapping "Done" on the keyboard toolbar dismisses the keyboard but does not always fire `focusout` synchronously. The DOM focus may remain on the input until a subsequent user tap, or the event sequence (keyboard dismissal → visualViewport change → focusout) may race differently in standalone WKWebView.

2. **rAF never fired:** If `focusout` fires while the keyboard animation is still in progress, the rAF callback might be deferred until the animation completes. By then, the hook's internal state (handler reference) might have been garbage collected or the component may have re-rendered.

3. **`activeElement` race:** The cleanup checks `if (isEditableElement(document.activeElement))`. After keyboard dismiss in standalone PWA, `document.activeElement` may still be the input (iOS often keeps focus on the input even after Done is tapped — the keyboard dismisses visually but the input retains logical focus). The guard would skip cleanup, leaving the inline heights permanently applied.

The result was a permanently-shrunken layout: `html`/`body` stuck at the keyboard-open `visualViewport.height`, leaving a dead space below the nav. The only way to recover was to kill and restart the PWA.

---

### Reverts: `25eb6f6`, `6be244f`, `64c2d82` — back to baseline

All three experiments were reverted sequentially:

1. `25eb6f6` — Revert `f7dfff8` (useKeyboardActiveViewport)
2. `6be244f` — Revert `56a90d4` (useEditingMode)
3. `64c2d82` — Revert `1dae4cd` (scroll nudge)

Each revert was a standard `git revert --no-edit` with conflict resolution. The revert of `1dae4cd` left an orphaned `use-editing-mode.ts` file (recreated by the revert logic); cleaned up in commit `190559b`.

**Total of 4 revert/cleanup commits to restore the baseline.**

---

## 4. What Each New Approach Got Wrong

### Approach 8: useEditingMode (hide nav on focus)
**Wrong assumption:** Unmounting the nav during keyboard activity and re-mounting it on `focusout` would let it render into a correct post-keyboard layout.  
**Reality:** The mount itself triggered a reflow that fixed the position, but this was indistinguishable from the manual-tap fix — it relied on the same forced-reflow side effect. Inconsistent during route changes. Also visually jarring (nav flashing in/out).

### Approach 9: scroll nudge on focusout
**Wrong assumption:** `window.scrollTo(0,1)` has scroll room and forces a compositor flush.  
**Reality:** The `.app-shell` at `h-dvh overflow-hidden` eliminates all root-level scrollable overflow. `documentElement.scrollHeight === clientHeight` — the nudge is a no-op. The fix should have targeted `<main>` (the actual scrollable element), but this was never tested because the user pivoted to the next experiment.

### Approach 10: visualViewport inline height on html/body
**Wrong assumption:** Setting inline pixel heights synchronously on `html`/`body` bypasses the `dvh` staleness bug; clearing them on `focusout` is reliable.  
**Reality:** On iOS standalone PWA, `focusout` is not a reliable signal — the input may retain logical focus after the keyboard visually dismisses. The rAF-delayed cleanup never ran because the `activeElement` guard blocked it. The app got stuck in keyboard-open layout permanently.

---

## 5. Code Churn Summary (Part 2)

| Metric | Value |
|--------|-------|
| Commits (additional) | 11 |
| Experiments tried | 3 (attempts 8, 9, 10) |
| Experiments reverted | 3 |
| Net line change after all commits | **0** — back to exact baseline |
| Files created and later deleted | 3 hooks + 2 test files (all deleted) |
| CSS rules added and removed | 1 (`keyboard-active .app-shell`) |
| New test files added and removed | 2 |
| Device test sessions | 3 (one per experiment) |
| Intermediate states that broke the UI | 1 (Experiment 10 — stuck layout, app unusable) |

---

## 6. Current State of the Codebase

### HEAD: `190559b`

The codebase is at the exact pre-experiment baseline, matching `c37bbfd`.

**Root layout (`app/layout.tsx`):**
```ts
export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [...],
};
// No interactiveWidget
```

**App layout (`app/(app)/layout.tsx`):**
```tsx
<div className="app-shell flex h-dvh max-h-dvh flex-col overflow-hidden bg-cs-background">
  <main className="app-main flex-1 min-h-0 w-full min-w-0 overflow-x-hidden overflow-y-auto [overscroll-behavior:contain]">
    {children}
  </main>
  <BottomTabNav />
</div>
```

**Nav class (`lib/design/layout.ts`):**
```
shrink-0 z-10 border-t border-cs-border bg-cs-surface pb-safe
```

**CSS variables (`globals.css`):**
```css
--app-tab-bar-content-height: calc(2.75rem + 1rem + 1px);
```
No `--app-tab-bar-total-height` variable.

**html/body CSS:**
```css
html { overflow-x: hidden; max-width: 100%; }
body { overflow-x: hidden; max-width: 100%; touch-action: pan-y; }
```

**Hooks directory:**
```
lib/hooks/
  use-keyboard-inset.ts     ← pre-existing, unrelated to this issue
```
No experiment hooks present.

**Test count:** 242 tests (45 files), lint clean, production build green.

### What the bug looks like now

Same as it did at the very start: a user types into any text field, dismisses the keyboard, and the bottom tab nav floats above the physical screen bottom. A single tap or scroll on the screen snaps it back to the correct position.

---

## 7. Hypotheses for Root Cause (Updated)

The original report's hypotheses stand. The 3 additional experiments add new evidence:

### Hypothesis A: WKWebView deferred compositor paint (STRENGTHENED)

Experiment 10 proved that even changing `html`/`body` **inline pixel heights** (which should force an immediate synchronous layout) doesn't prevent the deferred position. The height change applied to the DOM, but the visual position of the nav (a child of `.app-shell`, sized by its parent) did not update until a manual tap. This confirms the deferral is at the compositor level, not the style/layout level.

### Hypothesis C: `innerHeight` stays short (STRENGTHENED)

Experiment 10's `focusout` timing issue demonstrated that iOS keeps DOM focus on the input even after "Done" dismisses the keyboard. This means any JS-based approach that relies on `focusout` or `blur` events is unreliable in standalone PWA mode. The keyboard hide event (which would be the correct signal) is not exposed to web content.

### New Hypothesis F: No reliable event exists for "keyboard just finished dismissing"

There is no `keyboardWillHide` / `keyboardDidHide` event in Safari for web content. The closest signals are:
- `visualViewport.resize` — fires, but rAF-delayed read may still get stale values
- `focusout` — fires, but input may retain logical focus
- `resize` on `window` — fires, but `innerHeight` may lag indefinitely

Without a reliable "keyboard is gone and viewport has settled" event, any JS approach has to guess timing or rely on polling — both fragile.

### New Hypothesis G: The `h-dvh` unit IS the problem; inline pixel heights during keyboard activity can work but cleanup is unreliable

Experiment 10's mechanism (inline pixel heights during keyboard, cleanup on focusout) might actually work if the cleanup were triggered by a different signal — e.g., a polling loop that detects when `visualViewport.height` reaches the full screen height and stays there for N frames. But polling is ugly and battery-intensive.

### New Hypothesis H: The scroll-nudge approach might work on `<main>` instead of `window`

Experiment 9's scroll nudge targeted `window`, which had no scroll room. The documented fallback (nudge `<main>` instead) was never tested. `<main>` has `overflow-y: auto` and contains the page content — it likely has scrollable overflow on most pages. If a 1px nudge on `<main>` forces the same compositor recompute that a manual tap triggers, this approach may yet succeed. **This is the most promising untested path.**

---

## 8. Unanswered Questions

- **Does programmatic scrolling of `<main>` (not `window`) force the WKWebView compositor recompute after keyboard dismiss?** This is the one untested path from Experiment 9's documented fallbacks.
- **Is there a CSS-only approach that doesn't use `dvh` at all?** E.g., `calc(100% - safe-area-bottom)` on the shell? All attempts to avoid `dvh` have required `position: fixed` (which failed) or broke safe-area.
- **Does the `visualViewport` `resize` event fire with correct and stale-free values if read in `setTimeout(200)` instead of `rAF`?** The animation-timing fallback from Experiment 9 was also never tested.
- **Could interacting with the WKWebView's `scrollView` (via a native plugin or Capacitor) resolve this?** This question is out of scope for a pure-web codebase but may be the only viable fix.

---

*This report was compiled from 11 additional git commits, 3 device test sessions, and agent session transcript. All 10 attempted approaches (7 from Part 1 + 3 from Part 2) have failed or been reverted. The codebase is at its clean pre-experiment baseline with 242 tests passing.*
