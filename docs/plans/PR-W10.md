# PR-W10: PWA, Notifications & Release Hardening

**Status:** Implemented  
**Depends on:** [PR-W06](./PR-W06.md), [PR-W08](./PR-W08.md), [PR-W09](./PR-W09.md), [PR-W04](./PR-W04.md)  
**Series:** Final PR in the CalSnap Web 10-PR roadmap

---

## Objective

Close the web series with installable PWA support, in-app weigh-in reminder banner, privacy policy, client-side Gemini fetch cancellation, merge-blocking Playwright E2E, required Firebase rules integration in CI, and a documented release QA matrix.

**Out of scope (locked):** FCM/Web Push, daily log reminders, weekday/time-gated banner delivery, offline meal logging, server-side Gemini abort, Firestore schema changes, reminder banner E2E.

---

## What shipped

| Area | Implementation |
|------|----------------|
| Weigh-in reminder | `lib/progress/weigh-in-reminder.ts` (overdue-only); `WeighInReminderBanner` on dashboard |
| AbortController | `use-meal-scanner.ts`, `use-generate-insight.ts` — client fetch cancel + generation guard |
| Privacy | Public `/privacy` with GitHub issues contact |
| PWA | `manifest.webmanifest`, icons, `@serwist/next` SW, `InstallPromptBanner` |
| E2E | Playwright Chromium happy path with emulators + mocked `/api/analyze-meal` |
| CI | `.github/workflows/calsnap-web.yml` — unit ∥ integration → e2e |
| Rules tests | `storage-rules.test.ts`; unauthenticated profile read denied |

---

## Release QA matrix

### Automated (CI merge gate)

| # | Criterion | Verification | Evidence |
|---|-----------|--------------|----------|
| 1 | Vitest unit tests | `pnpm test` | CI `unit` job |
| 2 | ESLint | `pnpm lint` | CI `unit` job |
| 3 | Production build (`next build --webpack`) | `pnpm build` | CI `unit` job |
| 4 | Firestore + Storage rules | `pnpm test:integration` | CI `integration` job |
| 5 | Playwright happy path | `pnpm test:e2e` | CI `e2e` job |
| 6 | No `GEMINI_API_KEY` in client bundle | `! grep -rq GEMINI_API_KEY .next/static` | CI `unit` job |
| 7 | Gemini cancel on navigate-away | Unit generation guard + client abort | `analyze-generation.test.ts`, manual |
| 8 | Copy module hygiene | All user strings in `lib/copy/` | Review |

### Manual (operator sign-off)

| # | Criterion | Notes |
|---|-----------|-------|
| 1 | Add to Home Screen — iOS Safari | Share → Add to Home Screen |
| 2 | Add to Home Screen — Android Chrome | `beforeinstallprompt` CTA |
| 3 | PWA standalone opens logged-in dashboard | `display: standalone` |
| 4 | Weigh-in banner when 7+ days overdue | Enable reminder; seed old weigh-in or wait |
| 5 | Mobile Lighthouse baseline | Document scores in release notes |
| 6 | Keyboard matrix | Auth, onboarding, settings, weigh-in, manual meal |
| 7 | 320px + 200% zoom regression | Layout tokens from W09 |
| 8 | Privacy page accuracy | `/privacy` vs actual data practices |
| 9 | Production Vercel env vars | `GEMINI_API_KEY`, Firebase admin, `NEXT_PUBLIC_*` |

---

## Local merge gate

```bash
cd calsnap-web
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm test:integration
pnpm test:e2e
```

Requires Java 21+ for Firebase emulators (`firebase-tools` devDependency; CI uses Temurin 21).

---

## Web deltas vs iOS PR-10 / PR-12

| Area | iOS | Web W10 |
|------|-----|---------|
| Notifications | Local push | In-app overdue dashboard banner |
| Reminder schedule | Push on weekday/time | Prefs saved; banner is overdue-only |
| Daily log reminder | PR-10 toggle | Skipped |
| Widgets | WidgetKit | PWA install prompt |
| Privacy | PrivacyInfo.xcprivacy | `/privacy` page |
| QA | TestFlight + Instruments | Playwright + Lighthouse + manual |

---

## PWA offline scope (locked)

Serwist precaches static assets, manifest, and icons. `/api/*` and **document navigations** use **NetworkOnly** — no offline meal logging or cached authenticated HTML.

---

## Gemini abort (locked)

Client `AbortController` cancels the browser fetch when navigating away mid-scan. The server may still complete the Gemini call; stale results are not applied thanks to the generation guard.

---

## Acceptance criteria

- [x] Dashboard overdue weigh-in banner + snooze + sheet open
- [x] Navigate away mid-scan cancels fetch; stale results not applied
- [x] `/privacy` public and linked from Settings
- [x] PWA manifest + SW build with `next build --webpack`
- [x] Playwright happy path in CI
- [x] `pnpm test:integration` green (firestore + storage rules)
- [x] No `GEMINI_API_KEY` in `.next/static`
- [x] This doc with QA matrix

---

## Files changed (summary)

**Created:** `weigh-in-reminder.ts`, `use-weigh-in-reminder.ts`, `WeighInReminderBanner.tsx`, `InstallPromptBanner.tsx`, `lib/pwa/install-storage.ts`, `lib/copy/privacy.ts`, `lib/copy/pwa.ts`, `app/privacy/page.tsx`, `app/sw.ts`, `public/manifest.webmanifest`, icons, Playwright config + e2e, `storage-rules.test.ts`, `weigh-in-reminder.test.ts`, `.github/workflows/calsnap-web.yml`

**Modified:** `dashboard/page.tsx`, `use-meal-scanner.ts`, `use-generate-insight.ts`, `middleware.ts`, `AboutSection.tsx`, `constants.ts`, `settings.ts` copy, `user-data-deletion.ts`, `next.config.ts`, `app/layout.tsx`, `app/(app)/layout.tsx`, onboarding page, `package.json`, README files
