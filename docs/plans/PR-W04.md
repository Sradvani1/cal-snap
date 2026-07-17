# PR W04: Meal Scanner — Gemini Integration

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w04_scanner_b44131b3.plan.md`](../../../.cursor/plans/pr_w04_scanner_b44131b3.plan.md), [PR-W01](./PR-W01.md), [PR-W02](./PR-W02.md), [PR-W03](./PR-W03.md)

---

## 1. Objective

Replace the W03 `/scan` stub with the full meal scanner flow: camera/gallery capture, client JPEG compression, server-side Gemini 2.5 Flash analysis, editable results with proportional macro scaling, manual entry fallback, Firebase Storage photo upload on log, and Firestore meal persistence—with dashboard refresh via TanStack Query invalidation.

---

## 2. In scope

- Domain: `EditableFoodItem` weight-ratio scaling, meal totals, confidence semantics
- Client photo processor (Canvas API, `AppConstants.MealPhoto` retry grid)
- Server-only Gemini lib (`@google/genai`, zod validation, JSON parser port)
- `POST /api/analyze-meal` with `__session` cookie auth, multipart JPEG
- Storage rules + emulator wiring; `uploadMealPhoto` + `createMeal`
- `useMealScanner` hook + scanner UI components
- Unsaved-work guard: tab-nav confirm, Discard button, `beforeunload`
- Post-log: invalidate `todaysMeals` → redirect `/dashboard`

---

## 3. Out of scope

- Meal edit/delete (W05), `loadForEditing`, USDA lookup
- shadcn / design tokens (W09)
- Rate limiting, AbortController on navigate-away (W10)

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `lib/scanner/editable-food-item.ts` | Editable item model + scaling |
| `lib/scanner/meal-totals.ts` | Totals, confidence, flag helpers |
| `lib/scanner/use-meal-scanner.ts` | Phase machine ViewModel port |
| `lib/scanner/unsaved-work-context.tsx` | Tab-nav unsaved guard context |
| `lib/gemini/*` | Schema, prompt, parser, zod, analyze-meal |
| `lib/auth/verify-api-session.ts` | Shared API session verification |
| `lib/services/meal-photo-processor.ts` | Browser JPEG compression |
| `lib/queries/use-log-meal.ts` | Upload + create mutation |
| `app/api/analyze-meal/route.ts` | Authenticated analyze endpoint |
| `components/scanner/*` | Capture, analyzing, results, manual, error UI |
| `storage.rules` | uid-scoped meal photo paths |
| `tests/unit/editable-food-item.test.ts` | Scaling + confidence tests |
| `tests/unit/meal-analysis-parser.test.ts` | Parser port tests |
| `tests/unit/analyze-meal-route.test.ts` | Mocked route tests |
| `tests/unit/meal-photo-processor.test.ts` | Pure helper tests |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `package.json` | `@google/genai`, `zod` |
| `.env.local.example` | `GEMINI_API_KEY` comment |
| `firebase.json` | Storage rules path |
| `lib/firebase/emulator.ts` | Storage emulator connect |
| `lib/firebase/client.ts` | Storage emulator in `getFirebaseStorage` |
| `lib/repositories/meals.ts` | `uploadMealPhoto`, `createMeal` |
| `app/(app)/scan/page.tsx` | Full scanner wiring |
| `app/(app)/layout.tsx` | `UnsavedWorkProvider` |
| `components/app/BottomTabNav.tsx` | Unsaved-work intercept on tab click |

---

## 6. Tests

### Unit (merge gate)

```bash
cd calsnap-web && pnpm test
```

Covers editable item scaling, meal-analysis JSON parser, analyze-meal route (mocked auth/Gemini), photo processor retry grid and dimension helpers.

### Merge gate

```bash
cd calsnap-web && pnpm install && pnpm test && pnpm lint && pnpm build
```

Verify `GEMINI_API_KEY` not in client bundle:

```bash
grep -r GEMINI_API_KEY calsnap-web/.next/static || echo "OK: not in client bundle"
```

---

## 7. Manual test plan

1. Emulators + `GEMINI_API_KEY` in `.env.local`; `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`
2. Onboarding → `/scan` via tab or dashboard FAB
3. Gallery: pick food photo → Analyze → results (~5s on WiFi)
4. Adjust item weight → totals update live
5. Log This Meal → dashboard ring/macros update
6. Discard from results → no Firestore doc, no Storage object
7. Manual entry (no photo): 2 items → log → `geminiConfidence === 0`, no `photoStoragePath`
8. Offline before analyze → error banner; missing API key → 503 message
9. Pick photo → tap Log tab → discard confirm; confirm → navigates; cancel → stays
10. Mobile: camera input on iOS Safari + Chrome Android (320px)

---

## 8. Web deltas vs iOS PR-04

| Area | iOS | Web W04 |
|------|-----|---------|
| Gemini auth | User Keychain BYOK | Server `GEMINI_API_KEY` |
| Photo persistence | SwiftData `photoData` | Storage `photoStoragePath` |
| HealthKit | Fire-and-forget after save | Removed |
| Camera | UIKit picker | `<input capture="environment">` |
| Network check | NWPathMonitor 2s | `navigator.onLine` |
| Dashboard refresh | Navigation pop | TanStack Query invalidation |
| Back guard | Custom nav back | Tab intercept + Discard + `beforeunload` |
| Storage orphan on Firestore fail | N/A | Accepted (W08 cleanup) |
| Rate limiting | N/A | Deferred to W10 |

---

## 9. Pull request

**Title:** PR W04: Meal Scanner — Gemini Integration

**Summary**

- Implements camera/gallery capture, client JPEG compression, server-side Gemini 2.5 Flash via `/api/analyze-meal`, editable results with weight-ratio scaling, manual entry fallback, Storage upload on log, and Firestore meal persistence.

**Test plan**

```bash
cd calsnap-web
pnpm install
pnpm test
pnpm lint
pnpm build
```

Manual: emulators + real photo analyze + log + discard + manual-without-photo + tab unsaved guard.
