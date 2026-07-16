---
name: PR W10 PWA Release
overview: "PR-W10 makes CalSnap Web installable (PWA), delivers the v1 in-app weigh-in reminder banner, hardens release quality with merge-blocking Playwright E2E + required rules integration in CI, adds a privacy policy page, wires AbortController for Gemini calls, and documents the release QA matrix — closing the 10-PR web series without FCM or daily-log reminders."
todos:
  - id: reminder-logic-banner
    content: "Create weigh-in-reminder.ts (overdue-only) + unit tests; fix defaultReminderWeekday; WeighInReminderBanner on dashboard; update settings copy"
    status: pending
  - id: abort-controller
    content: Client-only AbortController in use-meal-scanner + generate-insight (no server signal); extend tests
    status: pending
  - id: privacy-page
    content: Add /privacy public page (GitHub issues contact), copy module, middleware exemption, AboutSection link
    status: pending
  - id: pwa-serwist
    content: Add manifest, icons, @serwist/next SW (minimal offline, next build --webpack), metadata, InstallPromptBanner after first dashboard visit
    status: pending
  - id: playwright-e2e
    content: Playwright config (Chromium, 2 retries), onboarding/scan helpers, merge-blocking happy-path spec with mocked analyze-meal
    status: pending
  - id: ci-workflow
    content: Create .github/workflows/calsnap-web.yml — unit + integration (parallel) + webpack build + secrets grep + Playwright with auth/firestore/storage emulators; firebase-tools devDep + Java 17
    status: pending
  - id: rules-tests
    content: Add storage-rules integration test; strengthen firestore negative coverage
    status: pending
  - id: docs-qa
    content: Write PR-W10.md QA matrix; update calsnap-web/README.md and docs/implementation/web/README.md
    status: pending
isProject: false
---

# PR W10: PWA, Notifications and Release Hardening

## Objective

Finish the CalSnap Web series: installable PWA, **in-app weekly weigh-in reminder** (web substitute for iOS local notifications), privacy policy, Gemini request cancellation, **merge-blocking** Playwright happy-path E2E, GitHub Actions CI with **required** rules integration tests, and a documented release QA matrix — mirroring iOS [PR-10](../docs/implementation/PR-10.md) + [PR-12](../docs/implementation/PR-12.md) intent with web-specific deltas.

**Depends on (already implemented):**

| PR | Reuse |
|----|-------|
| [PR-W06](docs/implementation/web/PR-W06.md) | [`reminder-prefs.ts`](calsnap-web/lib/progress/reminder-prefs.ts), [`weigh-in-snooze.ts`](calsnap-web/lib/progress/weigh-in-snooze.ts), [`WeighInSheet`](calsnap-web/components/progress/WeighInSheet.tsx), [`latestWeighIn`](calsnap-web/lib/progress/progress-stats.ts) |
| [PR-W08](docs/implementation/web/PR-W08.md) | [`NotificationsSection`](calsnap-web/components/settings/NotificationsSection.tsx) — prefs persisted on profile |
| [PR-W09](docs/implementation/web/PR-W09.md) | Design tokens, [`lib/copy/`](calsnap-web/lib/copy/), `AppDialog`, `SectionCard`, reduced-motion helpers |
| [PR-W04](docs/implementation/web/PR-W04.md) | [`useMealScanner`](calsnap-web/lib/scanner/use-meal-scanner.ts) — generation guard exists; AbortController deferred here |

**Regression baseline:** ~138 Vitest cases across `calsnap-web/tests/` (W01–W09). W10 must keep all green and add new coverage.

---

## Sharpen-plan Q&A (locked 2026-06-28)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Web Push (FCM) | **Out of merge scope** | Master plan stretch; v1 = in-app banner only |
| Daily log reminder | **Out of scope** | Web v1 = weigh-in banner only; no local notifications |
| **Reminder trigger rule** | **Overdue-only** | Show when enabled + not snoozed + (no weigh-in and profile age ≥7 days) OR (last weigh-in ≥7 calendar days ago). **Ignore weekday/time prefs for v1 delivery** — prefs saved for future push |
| **E2E CI gate** | **Merge-blocking** | Single Chromium project, 2 retries, emulators + dev server in CI |
| **Rules integration CI** | **Required parallel job** | High value, low cost; Firestore + Storage rules regression |
| **PWA offline scope** | **Minimal installability** | Precache static assets + manifest/icons; NetworkOnly for `/api/*` and HTML app routes — no offline meal logging |
| **Install prompt timing** | **Once after first dashboard visit post-onboarding** | Dismiss persists in localStorage; hide when standalone |
| **Privacy contact** | **GitHub repo issues link** | No personal email in repo; operator can redirect later |

### Sharpen-plan round 2 (locked 2026-06-28)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Serwist + Next 16 build** | **`next build --webpack`** when Serwist enabled | Serwist hooks webpack; avoids Turbopack SW incompatibility |
| **Reminder banner surfaces** | **Dashboard only** | Matches iOS notification → dashboard sheet; no duplicate on Progress |
| **Gemini abort depth** | **Client-only v1** | Cancel fetch + generation guard; skip `request.signal` → Gemini SDK |
| **E2E happy path scope** | **Full path with Storage emulator** | Scan → mock analyze → log with photo upload; emulators auth+firestore+storage |
| **Reminder banner automation** | **Unit tests + manual QA** | No clock-mocked E2E; pure function tests sufficient |
| **Firebase emulators in CI** | **`firebase-tools` devDependency + Java 17 in GHA** | Reproducible pinned CLI via `pnpm exec firebase` |

---

## Sharpened decisions (lock before coding)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PWA library | **`@serwist/next`** | App Router native; production build via **`next build --webpack`** |
| Production build script | **`"build": "next build --webpack"`** (when Serwist wired) | Serwist requires webpack pipeline on Next 16 |
| Gemini abort | **Client fetch abort only** | Server may finish; UI must not apply stale results |
| E2E emulators | **auth + firestore + storage** | Photo upload on meal log requires Storage emulator |
| CI Firebase CLI | **`firebase-tools` in devDependencies** | Pin version; GHA sets up Java 17 |
| Reminder banner E2E | **Out of happy-path spec** | Covered by `weigh-in-reminder.test.ts` + manual QA row |
| Weekday default fix | **`defaultReminderWeekday: 0`** (Sunday) | W08 UI uses JS 0=Sun; constant was `1` (Monday) |
| Reminder banner surface | **Dashboard only** | Matches iOS notification tap → dashboard weigh-in sheet |
| Install banner storage | **`pwaInstallDismissed-{uid}`** in localStorage | Per-user dismiss; cleared on delete-all-data |
| First dashboard visit flag | **`pwaInstallEligible-{uid}`** set on onboarding complete | Show install banner once on first dashboard render |
| Privacy route | **`/privacy` public** | Middleware excludes auth gate |
| E2E auth | **Firebase Auth emulator + email/password** | Avoid Google OAuth in CI |
| E2E Gemini | **`page.route` mock of `/api/analyze-meal`** | No real API key in CI |
| CI location | **`.github/workflows/calsnap-web.yml`** | `working-directory: calsnap-web` |
| New features / schema | **None** | Reminder fields exist; no Firestore changes |

---

## Architecture

```mermaid
flowchart TB
  subgraph pwa [PWA_Layer]
    Manifest[manifest.webmanifest]
    SW[Serwist_ServiceWorker]
    InstallBanner[InstallPromptBanner]
  end

  subgraph reminders [InApp_Reminders]
    ReminderLogic[weigh-in-reminder.ts]
    Snooze[weigh-in-snooze.ts]
    Banner[WeighInReminderBanner]
    Sheet[WeighInSheet]
  end

  subgraph release [Release_Hardening]
    Abort[AbortController_on_Gemini]
    E2E[Playwright_happy_path]
    CI[GitHub_Actions]
    Privacy[/privacy_page]
  end

  Dashboard --> ReminderLogic
  ReminderLogic --> Snooze
  ReminderLogic --> Banner
  Banner --> Sheet
  Manifest --> SW
  InstallBanner --> Manifest
  useMealScanner --> Abort
  CI --> E2E
```

---

## 1. In-app weigh-in reminder (v1 notifications)

### 1.1 Pure reminder logic — overdue-only

Create [`calsnap-web/lib/progress/weigh-in-reminder.ts`](calsnap-web/lib/progress/weigh-in-reminder.ts):

```typescript
export function shouldShowWeighInReminderBanner(input: {
  prefs: ResolvedReminderPrefs;
  latestWeighIn: WeighIn | undefined;
  profileCreatedAt: Date;
  uid: string;
  now?: Date;
}): boolean;
```

**Rules (locked):**

1. `prefs.weighInReminderEnabled === false` → hide
2. `isWeighInSnoozed(uid, now)` → hide ([`weigh-in-snooze.ts`](calsnap-web/lib/progress/weigh-in-snooze.ts))
3. **Overdue:**
   - No weigh-ins: `daysSince(profileCreatedAt) >= 7`
   - Has weigh-ins: `daysSince(latestWeighIn.date) >= 7` (calendar days, local timezone)
4. **Weekday/time prefs:** persisted in Settings for future Web Push; **not evaluated for v1 in-app banner**

Add [`calsnap-web/tests/unit/weigh-in-reminder.test.ts`](calsnap-web/tests/unit/weigh-in-reminder.test.ts):

- disabled → false
- snoozed → false
- weigh-in 3 days ago → false
- weigh-in 8 days ago → true
- no weigh-in, profile 5 days old → false
- no weigh-in, profile 8 days old → true
- fresh weigh-in after banner shown → false

**Fix default weekday:** change [`AppConstants.Notifications.defaultReminderWeekday`](calsnap-web/lib/constants.ts) from `1` → `0` (Sunday, iOS intent). Existing saved profiles unchanged.

### 1.2 Dashboard banner UI

Create [`calsnap-web/components/dashboard/WeighInReminderBanner.tsx`](calsnap-web/components/dashboard/WeighInReminderBanner.tsx):

- Compact alert card using existing tokens (`cs-accent` / `SectionCard`-style)
- Copy: `dashboard.reminder.title`, `dashboard.reminder.body`, `dashboard.reminder.logNow`, `dashboard.reminder.remindTomorrow`
- Primary → open existing `WeighInSheet`
- Secondary → `snoozeWeighInUntilTomorrow(uid)` + hide

Create [`calsnap-web/lib/queries/use-weigh-in-reminder.ts`](calsnap-web/lib/queries/use-weigh-in-reminder.ts) combining `useProfile` + weigh-in data + pure logic.

Wire in [`calsnap-web/app/(app)/dashboard/page.tsx`](calsnap-web/app/(app)/dashboard/page.tsx) above `CalorieRingCard`.

### 1.3 Settings copy update

Update [`calsnap-web/lib/copy/settings.ts`](calsnap-web/lib/copy/settings.ts):

- Replace `settings.reminder.futureNote` with copy explaining **in-app dashboard banner** when overdue; weekday/time apply when Web Push ships

---

## 2. PWA (installable web app)

### 2.1 Manifest and icons

Create [`calsnap-web/public/manifest.webmanifest`](calsnap-web/public/manifest.webmanifest):

- `name` / `short_name`: CalSnap
- `display`: standalone; `start_url`: `/dashboard`; `scope`: `/`
- `theme_color` / `background_color` from [`lib/design/colors.ts`](calsnap-web/lib/design/colors.ts)
- Icons: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — resize from [`CalSnap/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png`](CalSnap/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png)

Wire in [`calsnap-web/app/layout.tsx`](calsnap-web/app/layout.tsx):

```typescript
export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: copy('common.brand.calsnap') },
  icons: { apple: '/apple-touch-icon.png' },
};
```

### 2.2 Serwist service worker — minimal offline (locked)

Install `@serwist/next` + `serwist`.

| Path | Purpose |
|------|---------|
| [`calsnap-web/app/sw.ts`](calsnap-web/app/sw.ts) | SW entry |
| [`calsnap-web/next.config.ts`](calsnap-web/next.config.ts) | `withSerwistInit` wrapper |

**Caching policy (locked — minimal installability):**

- **Precache:** static assets, manifest, icons, fonts
- **NetworkOnly:** `/api/*` (session + Gemini)
- **NetworkOnly or default:** HTML document routes for `(app)` — **no offline meal logging or cached authenticated pages**
- Disable SW in development (`disable: process.env.NODE_ENV === 'development'`)
- Production build: **`pnpm build` → `next build --webpack`** (update [`package.json`](calsnap-web/package.json) script after Serwist install)

Document offline limitation in PR-W10.md.

**Build verification (implementer checklist):** run `pnpm build` locally after Serwist wiring; if SW generation fails, confirm `--webpack` flag is present and Serwist version matches Next 16 docs.

### 2.3 Install prompt banner (locked timing)

Create [`calsnap-web/components/pwa/InstallPromptBanner.tsx`](calsnap-web/components/pwa/InstallPromptBanner.tsx):

- Show **once** on first dashboard visit after onboarding (`pwaInstallEligible-{uid}` → show → clear)
- Hide when standalone / `navigator.standalone`
- Hide when dismissed (`pwaInstallDismissed-{uid}`)
- Android: `beforeinstallprompt` → Install CTA
- iOS: instructional copy (Share → Add to Home Screen)
- Copy in [`lib/copy/pwa.ts`](calsnap-web/lib/copy/pwa.ts)

Mount in [`calsnap-web/app/(app)/layout.tsx`](calsnap-web/app/(app)/layout.tsx).

Set `pwaInstallEligible-{uid}` in onboarding done handler or first dashboard mount.

Clear both keys in [`user-data-deletion.ts`](calsnap-web/lib/services/user-data-deletion.ts).

---

## 3. Privacy policy page

Create [`calsnap-web/app/privacy/page.tsx`](calsnap-web/app/privacy/page.tsx) — public, no auth.

Sections:

- Data collected (Auth email, profile metrics, meals, photos)
- AI processing (Gemini server-side, operator API key)
- Storage (Firebase Auth, Firestore, Storage)
- Not collected (HealthKit, location, ads/tracking)
- Deletion (Settings → Delete all data)
- **Contact:** link to GitHub repository issues page (no personal email)

Copy namespace [`calsnap-web/lib/copy/privacy.ts`](calsnap-web/lib/copy/privacy.ts).

Update [`middleware.ts`](calsnap-web/middleware.ts) — `/privacy` public (no session redirect).

Link from [`AboutSection`](calsnap-web/components/settings/AboutSection.tsx).

---

## 4. Gemini AbortController

PR-W04 deferred to W10.

### 4.1 Client — meal scanner

Refactor [`use-meal-scanner.ts`](calsnap-web/lib/scanner/use-meal-scanner.ts):

- `abortControllerRef`; new controller per `analyze()`
- Pass `{ signal }` to `fetch('/api/analyze-meal')`
- `cancelAnalysis()` / `invalidateAnalyze()` / unmount → `abort()`
- Keep generation guard for races after abort

### 4.2 Client — analytics insight

Refactor [`use-generate-insight.ts`](calsnap-web/lib/queries/use-generate-insight.ts) + [`AnalyticsInsightCard`](calsnap-web/components/analytics/AnalyticsInsightCard.tsx) — abort on unmount.

### 4.3 Server — out of scope (locked)

Do **not** thread `request.signal` into `@google/genai` in W10. Client abort cancels the fetch; server may complete the Gemini call — acceptable v1 cost. Document in PR-W10.md.

---

## 5. Playwright E2E (merge-blocking)

### 5.1 Setup

DevDeps: `@playwright/test`.

| Path | Purpose |
|------|---------|
| [`playwright.config.ts`](calsnap-web/playwright.config.ts) | Chromium only, 2 retries, webServer |
| [`tests/e2e/happy-path.spec.ts`](calsnap-web/tests/e2e/happy-path.spec.ts) | Full flow |
| [`tests/e2e/helpers/onboarding.ts`](calsnap-web/tests/e2e/helpers/onboarding.ts) | Stable onboarding filler |
| [`tests/e2e/helpers/fixtures/meal-analysis.json`](calsnap-web/tests/e2e/helpers/fixtures/meal-analysis.json) | Mock response |
| [`tests/e2e/helpers/test-photo.jpg`](calsnap-web/tests/e2e/helpers/test-photo.jpg) | Scan input |

Scripts: `test:e2e`, `test:e2e:ui`.

**playwright.config.ts:**

- Single **Chromium** project
- `retries: process.env.CI ? 2 : 0`
- `webServer`:
  1. `pnpm exec firebase emulators:start --only auth,firestore,storage --project demo-calsnap` (port 4000 UI or auth 9099 health check)
  2. `pnpm dev` with `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (no `FIREBASE_ADMIN_*` needed — [`admin.ts`](calsnap-web/lib/firebase/admin.ts) initializes with projectId only against emulators)

**E2E env (locked):**

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-calsnap
GEMINI_API_KEY=test-not-used
```

Mock **`/api/analyze-meal`** via `page.route`; real Storage upload to emulator on log.

### 5.2 Happy path (locked scope)

| Step | Action | Assertion |
|------|--------|-----------|
| 1 | `/signup` unique email | Redirect toward onboarding |
| 2 | Complete onboarding via helper | `/dashboard` |
| 3 | `/scan` + mock `/api/analyze-meal` | Results with food items |
| 4 | Log meal | Dashboard shows meal |
| 5 | Weigh-in sheet → save | Chart/sheet closes |

Minimal `data-testid` only where role selectors are insufficient.

**Not in happy-path spec (locked):** overdue reminder banner visibility — covered by unit tests + manual QA (avoids Date mocking / Firestore seed complexity).

---

## 6. GitHub Actions CI (locked)

Create [`.github/workflows/calsnap-web.yml`](.github/workflows/calsnap-web.yml):

**Job 1 — `unit` (parallel):**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
! grep -rq GEMINI_API_KEY .next/static
```

**Job 2 — `integration` (parallel, required):**

```bash
# GHA: actions/setup-java@v4 with java-version: 17
pnpm test:integration
```

Update [`package.json`](calsnap-web/package.json):

```json
"test:integration": "firebase emulators:exec --only firestore,auth,storage --project demo-calsnap 'vitest run tests/integration'",
"build": "next build --webpack"
```

Add **`firebase-tools`** to devDependencies (pinned).

**Job 3 — `e2e` (needs unit + integration):**

```bash
actions/setup-java@v4  # Java 17 for Firebase emulators
npx playwright install --with-deps chromium
pnpm exec playwright test
```

E2E job starts emulators + dev server via Playwright `webServer` config (same as local). Path filter: `calsnap-web/**`, workflow file.

**Session note:** E2E relies on emulator-mode admin (`initializeApp({ projectId })` without service account) — no `FIREBASE_ADMIN_*` secrets in CI.

---

## 7. Firebase rules hardening

| File | Tests |
|------|-------|
| [`tests/integration/storage-rules.test.ts`](calsnap-web/tests/integration/storage-rules.test.ts) (new) | Owner read/write meal photo; cross-user denied |
| [`tests/integration/profile-firestore.test.ts`](calsnap-web/tests/integration/profile-firestore.test.ts) | Unauthenticated read fails |

---

## 8. Release QA matrix (PR-W10.md)

### Automated (CI merge gate)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Vitest unit tests | `pnpm test` |
| 2 | ESLint | `pnpm lint` |
| 3 | Production build | `pnpm build` |
| 4 | Firestore + Storage rules | `pnpm test:integration` (required CI) |
| 5 | Playwright happy path | `pnpm test:e2e` (required CI) |
| 6 | No GEMINI_API_KEY in client bundle | CI grep |
| 7 | Gemini cancel on navigate-away | Unit + manual |
| 8 | Copy module hygiene | Review |

### Manual (operator sign-off)

| # | Criterion |
|---|-----------|
| 1 | Add to Home Screen — iOS Safari |
| 2 | Add to Home Screen — Android Chrome |
| 3 | PWA standalone opens logged-in dashboard |
| 4 | Weigh-in banner when 7+ days overdue |
| 5 | Mobile Lighthouse baseline documented |
| 6 | Keyboard matrix (auth, onboarding, settings, weigh-in, manual meal) |
| 7 | 320px + 200% zoom regression |
| 8 | Privacy page accuracy |
| 9 | Production Vercel env vars |

---

## 9. Web deltas vs iOS PR-10 / PR-12

| Area | iOS | Web W10 |
|------|-----|---------|
| Notifications | Local push | In-app overdue banner |
| Reminder schedule | Push fires on weekday/time | Prefs saved; v1 banner is overdue-only |
| Daily log reminder | PR-10 toggle + push | Skipped |
| Widgets | WidgetKit | PWA install |
| Privacy | PrivacyInfo.xcprivacy | `/privacy` page |
| QA | TestFlight + Instruments | Playwright + Lighthouse + manual |

---

## 10. Implementation order

1. Reminder logic + banner + settings copy
2. AbortController
3. Privacy page
4. PWA (manifest, Serwist, install banner)
5. Playwright spec
6. CI workflow (unit + integration parallel, then e2e)
7. Storage rules test
8. PR-W10.md + README updates

---

## Acceptance criteria

- [ ] Add to Home Screen works on iOS Safari and Android Chrome (manual evidence)
- [ ] Dashboard banner when overdue + enabled + not snoozed
- [ ] Snooze + weigh-in save dismiss banner
- [ ] `/privacy` live; GitHub issues contact link
- [ ] Navigate away mid-scan cancels fetch; stale results not applied
- [ ] Playwright happy path green in CI (Chromium, 2 retries)
- [ ] `pnpm test:integration` green in CI
- [ ] No secrets in client bundle
- [ ] PR-W10.md QA matrix with evidence

---

## Files summary

**Create (~20):** manifest, icons, `app/sw.ts`, Serwist config, `InstallPromptBanner`, `WeighInReminderBanner`, `weigh-in-reminder.ts`, `use-weigh-in-reminder.ts`, `lib/copy/pwa.ts`, `lib/copy/privacy.ts`, `app/privacy/page.tsx`, Playwright config + e2e + helpers, `storage-rules.test.ts`, `weigh-in-reminder.test.ts`, `.github/workflows/calsnap-web.yml`, `docs/implementation/web/PR-W10.md`

**Modify (~13):** `next.config.ts`, `app/layout.tsx`, `app/(app)/layout.tsx`, `dashboard/page.tsx`, `middleware.ts`, `use-meal-scanner.ts`, `use-generate-insight.ts`, `AnalyticsInsightCard.tsx`, `AboutSection.tsx`, `lib/constants.ts`, `lib/copy/settings.ts`, `user-data-deletion.ts`, `package.json` (build script, test:integration, firebase-tools, playwright), README files

**Out of scope:** FCM Web Push, daily log reminder, weekday/time-gated in-app banner, offline meal logging, server-side Gemini abort, reminder banner E2E, Progress-tab duplicate banner, new Firestore fields
