# iOS Keyboard Viewport Deferral — Definitive Build Doc

**Date:** 2026-07-20  
**App:** `calsnap-web` (Next.js 16.2.9 App Router PWA, Serwist service worker)  
**Git range:** `66ae76a` (first attempt) → `4b90f72` (login fix)  
**Status:** **Working solution deployed.** 10 technical approaches failed. UX containment + hard-reload strategy adopted.

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [Root Cause](#2-root-cause)
3. [Failed Technical Approaches (10 total)](#3-failed-technical-approaches-10-total)
4. [The Working Solution](#4-the-working-solution)
5. [Architecture and Data Flow](#5-architecture-and-data-flow)
6. [Key Insight for Future Work](#6-key-insight-for-future-work)
7. [Pattern for Handling This Going Forward](#7-pattern-for-handling-this-going-forward)
8. [Checklist for Any New Keyboard-Affected Flow](#8-checklist-for-any-new-keyboard-affected-flow)
9. [Files Referenced](#9-files-referenced)

---

## 1. The Problem

In the CalSnap PWA running on iOS in **standalone mode** (home-screen installed, WKWebView-based), after the virtual keyboard is dismissed the bottom tab navigation bar floats partway up the screen — leaving a visible gap between the nav and the physical screen bottom. A user touch or scroll snaps it back.

### Also affects

- Any text input → keyboard dismiss → route change: the destination page renders with the nav in the wrong position
- Login/signup: typing email/password → keyboard dismiss → login succeeds → dashboard renders with nav floating
- Settings text fields → keyboard dismiss → nav jumps

### Not reproducible in

- Safari browser mode (non-standalone) on the same device
- Android (any browser)
- Desktop

---

## 2. Root Cause

iOS WKWebView in standalone PWA mode shrinks the **layout viewport** when the keyboard opens and does **not reliably restore it** after the keyboard dismisses — until a real user gesture (touch, scroll) forces a viewport recomputation.

The layout viewport (`window.innerHeight`) stays at the keyboard-open height after the keyboard has visually dismissed. Since `position: fixed; bottom: 0` and `dvh` (dynamic viewport height) both position elements relative to the **layout viewport** (not the **visual viewport**), the nav remains at the shrunken bottom.

This is a **confirmed WebKit platform bug**, not specific to CalSnap. It affects all PWAs with `position: fixed` bottom elements that follow keyboard interactions in iOS standalone mode. There is no CSS property or JavaScript API that reliably forces the layout viewport to restore.

---

## 3. Failed Technical Approaches (10 total)

All approaches were deployed to Vercel, tested on-device with a fresh PWA install, and reverted. The full failure reports are at:

- [FIXED-BOTTOM-NAV-FAILURE-REPORT.md](./FIXED-BOTTOM-NAV-FAILURE-REPORT.md) (approaches 1–7)
- [FIXED-BOTTOM-NAV-FAILURE-REPORT-2.md](./FIXED-BOTTOM-NAV-FAILURE-REPORT-2.md) (approaches 8–10)

### 3.1 CSS Layout Approaches

| # | Approach | What It Tried | Why It Failed |
|---|----------|--------------|---------------|
| 1 | `position: fixed; bottom: 0` on nav | Compositor-position nav immune to viewport changes | Fixed elements track the layout viewport, which stays shrunken |
| 2 | `html { position: fixed; overflow: hidden }` | Lock viewport to prevent resize | Broke safe-area — permanent white bar at screen bottom |
| 3 | `html { position: fixed; inset: 0 }` | Variant of #2 | Same safe-area gap |
| 4 | `html { overflow: hidden }` only | Prevent viewport resize without fixed positioning | No effect — WKWebView ignores CSS for viewport management |
| 5 | Revert html/body, keep `position: fixed` nav | Back to clean baseline with fixed nav | Same failure as #1 |

### 3.2 JavaScript/Event Approaches

| # | Approach | What It Tried | Why It Failed |
|---|----------|--------------|---------------|
| 6 | `visualViewport` JS anchor hook | Compute offset (innerHeight - visualViewport.height), apply as inline `bottom` style | WKWebView defers compositor-level repaints — the style was applied but ignored visually |
| 7 | `interactive-widget: overlays-content` | Tell browser to overlay keyboard instead of resizing viewport | WKWebView in standalone PWA mode ignores this meta tag |
| 8 | `useEditingMode` — unmount nav on focus | Nav absent during keyboard, re-mounts on focusout into correct layout | Inconsistent; relies on same forced-reflow side effect as manual tap; nav flashing was jarring |
| 9 | Scroll nudge on `focusout` | `window.scrollTo(0,1)` then `(0,0)` on keyboard dismiss to force compositor flush | `.app-shell` at `h-dvh overflow-hidden` eliminates root scroll room — nudge was a no-op |
| 10 | Inline `visualViewport.height` on `html`/`body` | Set pixel heights during keyboard, clear on `focusout` — bypass `dvh` entirely | `focusout` never fires reliably on iOS; `activeElement` guard blocked cleanup; app got stuck in shrunken layout permanently |

### 3.3 What the 10 Failures Prove

1. **No CSS property** can prevent WKWebView from shrinking the layout viewport when the keyboard opens.
2. **No reliable DOM event** signals "keyboard just finished dismissing" — `focusout` may not fire, `visualViewport.resize` may deliver stale values, `activeElement` may retain logical focus.
3. **Inline style changes** to fixed elements are computed correctly by the style/layout engine but deferred at the compositor level — the compositor repaint requires a real user gesture.
4. **Programmatic scroll** cannot substitute for user-initiated scroll when the root element has no scroll room.
5. **`interactive-widget`** CSS property works in Safari browser mode but is explicitly ignored by standalone PWA WKWebView.

---

## 4. The Working Solution

The solution is a **two-part strategy** that avoids the WebKit bug entirely rather than fixing it:

### Part A: Nav-Free Scan Zone (commit `3b149ff`)

The scan workflow (photo capture → describe meal → analyze → log/discard) hides the bottom tab nav entirely. The user cannot see or interact with the nav during scanning. When the workflow ends (meal logged or discarded), `window.location.replace('/dashboard')` performs a **full page load** that resets the WKWebView viewport to its correct state.

**Components:**
- `NavVisibilityProvider` context (`lib/app/nav-visibility-context.tsx`) — boolean state, wraps app layout
- `(app)/layout.tsx` — `{!hidden && <BottomTabNav />}` — nav absent during scan
- `ScanDescriptionFullScreen` — full-screen z-50 overlay replaces the inline textarea, so the text field lives in a layer that doesn't interact with the shell layout
- `scan/page.tsx` — `setHidden(true)` before scan workflow begins; `setHidden(false)` on unmount; `window.location.replace('/dashboard')` on log, discard, and navigation

### Part B: Auth Flow Hard Reload (commit `4b90f72`)

Login and signup pages use `window.location.replace` instead of `router.replace` to navigate after successful auth. The hard page load resets the viewport, preventing the stale keyboard-open layout from carrying forward to the dashboard.

**Changed files:**
- `app/(auth)/login/page.tsx` — line 26: `window.location.replace(...)` replaces `router.replace(...)`
- `app/(auth)/signup/page.tsx` — line 26: same fix

### Why this works

`window.location.replace('/dashboard')` causes the browser to **fully unload** the current page and **load a fresh document**. This triggers a complete WKWebView viewport recalculation from scratch — the same reset that happens when the user closes and reopens the PWA. The stale layout viewport state from the keyboard interaction is discarded along with the old document.

In contrast, `router.replace('/dashboard')` (client-side navigation) keeps the same WKWebView instance alive. The layout viewport's shrunken state persists across route transitions. The destination page renders into the stale viewport.

The tradeoff: hard navigation is slower (~200–500ms extra for the page to load and Firebase to re-hydrate from the cached auth token). The user sees the loading skeleton briefly. This is the same cost as any cold start.

---

## 5. Architecture and Data Flow

### Nav-free scan zone

```
Before scan workflow begins:
  setHidden(true)
    ↓
  (app)/layout.tsx re-renders
    ↓
  <BottomTabNav /> removed from DOM
    ↓
  ScanDescriptionFullScreen overlay (z-50) opens
    ↓ (user fills description, taps save)
  Overlay closes, keyboard dismisses
    ↓
  User logs or discards
    ↓
  window.location.replace('/dashboard')
    ↓ (full page load)
  WKWebView viewport reset to correct state
    ↓
  Firebase re-hydrates from IndexedDB cache
    ↓
  Dashboard renders with nav flush at bottom
```

### Auth flow hard reload

```
User types email/password on /login
  ↓
  Submits form
  ↓
  signInWithEmail(email, password) resolves
  ↓
  onAuthStateChanged fires with user
  ↓
  React effect fires: window.location.replace('/dashboard' | '/onboarding')
  ↓ (full page load)
  WKWebView viewport reset from stale keyboard state
  ↓
  Dashboard or onboarding renders correctly
```

---

## 6. Key Insight for Future Work

### 6.1 The WKWebView viewport reset is a hard requirement

Any client-side navigation that follows a keyboard interaction in standalone PWA mode will carry the stale viewport forward. **Full page loads (`window.location.replace`)** are the only reliable escape hatch.

### 6.2 `window.location.replace` vs `window.location.href`

Use `.replace()` not `.href`:
- `.replace('/dashboard')` — removes the current page from history. Back button goes to the previous app page (e.g., login), which then immediately redirects to dashboard again. This is acceptable.
- `.href = '/dashboard'` — adds the current page to history. Back button goes to login, creating a cycle. Slightly worse UX.

### 6.3 Static pages are fast enough for hard navigation

All target pages (`/dashboard`, `/onboarding`, `/login`) are **static** (`○` in Next.js build output). The initial HTML is pre-rendered and served from CDN. The browser renders the shell immediately while React hydrates. The visible delay is ~200ms on fast connections — acceptable for the reliability gain.

### 6.4 Firebase auth persistence across hard navigations

Firebase Auth persists tokens to IndexedDB by default. After a hard page load:
1. `onAuthStateChanged` fires with `null` briefly while Firebase reads the cache
2. Within ~100ms, the cached token is loaded and `onAuthStateChanged` fires with the user
3. The loading skeleton is shown during this window

This is the same behavior as any fresh page load or refresh. No special handling needed.

### 6.5 Google sign-in redirect flow

`signInWithRedirect` navigates the browser to Google. On return, the page loads fresh. `getRedirectResult()` captures the credential, auth state fires, and the hard navigation occurs. This adds a second page load (return from Google → hard nav to dashboard) but doesn't create any new failure modes.

---

## 7. Pattern for Handling This Going Forward

### 7.1 Keyboard → route change in any flow

If any page involves keyboard interaction followed by navigation to another route:

```ts
// ❌ Don't do this
router.replace('/dashboard');

// ✅ Do this
window.location.replace('/dashboard');
```

### 7.2 Multiple keyboard interactions on same page

If a user performs text input, navigates client-side to another page with more text input, and so on — each `window.location.replace` resets the viewport. The user sees full page loads between steps. If this is undesirable, consider:

- **Contain the keyboard interaction to a single page** (like the nav-free scan zone)
- **Use a dialog/overlay pattern** for text input rather than in-page fields
- **Accept the hard navigation** as a necessary tradeoff

### 7.3 Dialogs and overlays

For text input that must not affect the underlying page's viewport:

- Render the text field in a `fixed inset-0 z-50` overlay (creates a new stacking context)
- The overlay's `fixed` positioning is relative to the visual viewport
- When the overlay closes, the underlying page's layout viewport may still be stale — use `window.location.replace` for any subsequent navigation

### 7.4 Future-proofing: when to attempt technical fixes

If Apple ever fixes the underlying WKWebView bug, the criteria are:

1. `dvh` (dynamic viewport height) updates reliably after keyboard dismiss without a user gesture
2. `position: fixed; bottom: 0` elements return to the correct position without a touch/scroll
3. `interactive-widget: overlays-content` works in standalone PWA mode
4. `window.innerHeight` returns the correct full-screen value immediately after keyboard dismiss

If any of these change in a future iOS/Safari release, the hard-navigation workaround can be replaced with the simpler CSS approach.

**To detect the fix at runtime** (if needed):
```ts
// Test if the viewport bug is present
const testViewport = () => {
  const h = window.innerHeight;
  const vh = window.visualViewport?.height;
  // If keyboard is closed and innerHeight is full screen, bug may be fixed
  if (vh && Math.abs(h - vh) < 1) {
    // Potentially fixed — but this alone isn't sufficient
  }
};
```

However, given that this bug has persisted across multiple iOS major versions (at least iOS 15–19+), a native fix is unlikely in the near term.

---

## 8. Checklist for Any New Keyboard-Affected Flow

When adding any new page or feature that involves text input:

- [ ] Does this page have text input fields (input, textarea, contenteditable)?
- [ ] Does the user navigate to another route after the keyboard interaction?
- [ ] If yes, does the destination page have a bottom tab nav or any `position: fixed bottom-0` element?
- [ ] If yes to both: use `window.location.replace()` instead of `router.replace()` / `router.push()` for the post-keyboard navigation
- [ ] Could the text input be contained to an overlay/dialog instead of an in-page field?
- [ ] If containment is possible (one text field, no complex interactions): use the `fixed inset-0 z-50` overlay pattern
- [ ] Is the page eligible for the nav-free scan zone approach? (If the page is part of the scan workflow, wrap it in `NavVisibilityProvider`)

### Currently wrapped flows

| Flow | Approach | Location |
|------|----------|----------|
| Scan workflow (photo → describe → analyze → log) | Nav-free zone + hard reload | `(app)/scan/page.tsx` |
| Login (email/password or Google) | Hard reload after auth | `(auth)/login/page.tsx` |
| Signup (email/password or Google) | Hard reload after auth | `(auth)/signup/page.tsx` |

### Flows still affected (not wrapped, but keyboard is rare)

| Flow | Risk | Notes |
|------|------|-------|
| Settings (editing name, goals, weight) | Medium — user types, taps save, stays on Settings. Nav may momentarily be wrong until tap. Existing beforeunload protection is for scan only. | Not yet addressed because user stays on same page after save. If Settings ever navigates client-side after save, add hard reload. |
| Onboarding (text input fields) | Low — no tab nav present. Page may show cosmetic gap after keyboard dismiss. | No fix needed unless onboarding gains a bottom nav. |

---

## 9. Files Referenced

### Source files (current)

| File | Role |
|------|------|
| `calsnap-web/app/(app)/layout.tsx` | `NavVisibilityProvider` wrapper, conditional `<BottomTabNav />`, `AppLayoutContent` split |
| `calsnap-web/lib/app/nav-visibility-context.tsx` | Context provider for hiding nav during scan workflow |
| `calsnap-web/app/(app)/scan/page.tsx` | `setHidden(true/false)`, `window.location.replace` on log/discard |
| `calsnap-web/components/scanner/ScanDescriptionFullScreen.tsx` | `fixed inset-0 z-50` overlay for description entry, replaces inline textarea |
| `calsnap-web/components/scanner/MealScannerCaptureView.tsx` | Calls `setHidden(true)` before opening overlay, uses ScanDescriptionFullScreen |
| `calsnap-web/components/app/BottomTabNav.tsx` | `shrink-0` in-flow nav, no changes needed |
| `calsnap-web/lib/design/layout.ts` | `tabBar.nav` token = `shrink-0 z-10 border-t border-cs-border bg-cs-surface pb-safe` |
| `calsnap-web/app/(auth)/login/page.tsx` | `window.location.replace` after auth (line 26) |
| `calsnap-web/app/(auth)/signup/page.tsx` | `window.location.replace` after auth (line 26) |

### Build docs

| Doc | Content |
|-----|---------|
| `docs/build/FIXED-BOTTOM-NAV-FAILURE-REPORT.md` | Approaches 1–7 failure details |
| `docs/build/FIXED-BOTTOM-NAV-FAILURE-REPORT-2.md` | Approaches 8–10 failure details |
| `docs/build/FIXED-BOTTOM-NAV.md` | Original `position: fixed` approach (abandoned) |

### Key commits

| Commit | What |
|--------|------|
| `66ae76a` | First attempt: `position: fixed` on nav |
| `190559b` | Clean baseline after all 10 attempts reverted |
| `3b149ff` | Nav-free scan zone + hard reload on log/discard |
| `8c8baad` | Fix: discard without unsaved work also navigates |
| `4b90f72` | Login + signup hard reload after auth |

---

*This document is the single source of truth for the iOS keyboard viewport deferral issue. Read this before attempting any new fix. If a real fix is discovered (Apple patch or new web API), update this doc and the failure reports.*
