# CalSnap Web — Rollout Guide

Follow this guide in order to test, debug, and deploy CalSnap Web. You do **not** need a Firebase cloud project until **Phase 4**. Phases 1–3 use local Firebase emulators only.

**Related docs:** [PR-W10 QA matrix](./PR-W10.md) · [`calsnap-web/README.md`](../../../calsnap-web/README.md) · [`.env.local.example`](../../../calsnap-web/.env.local.example)

---

## Overview

| Phase | Goal | Firebase cloud? | Vercel? | Real Gemini? |
|-------|------|-----------------|---------|--------------|
| **1** | Automated tests (CI parity) | No | No | No (E2E mocks AI) |
| **2** | Manual browser QA on emulators | No | No | No |
| **3** | Real AI locally | No | No | Yes |
| **4** | Production Firebase parity (optional) | Yes | No | Yes |
| **5** | Deploy preview → production | Yes | Yes | Yes |

```text
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 (optional) ──► Phase 5
  tests      manual QA     real AI      real Firebase         Vercel
```

---

## Prerequisites (install once)

### Required for all phases

- [ ] **Node.js 22** — `cd calsnap-web && nvm use` (see `.nvmrc`)
- [ ] **pnpm** — `corepack enable && corepack prepare pnpm@latest --activate`
- [ ] **Dependencies** — `cd calsnap-web && pnpm install`

### Required for Phases 1, 2, 3 (emulators)

- [ ] **Java 21+** — Firebase emulators need a JRE. Verify: `java -version`
  - macOS: `brew install openjdk@21` or install Temurin 21
- [ ] **Firebase CLI** — bundled via `firebase-tools` devDependency; use `pnpm exec firebase --version`

### Required for Phase 3+

- [ ] **Gemini API key** — [Google AI Studio](https://aistudio.google.com/apikey) → create key

### Required for Phase 4–5

- [ ] **Firebase cloud project** — [Firebase Console](https://console.firebase.google.com/)
- [ ] **Vercel account** — [vercel.com](https://vercel.com)

---

## Environment files

| File | Purpose | Commit? |
|------|---------|---------|
| `.env.local` | Your local dev config | No (gitignored) |
| `.env.e2e` | Playwright / E2E defaults (emulator mode) | Yes |
| `.env.local.example` | Template for production vars | Yes |

### Phase 1–2 emulator config (copy into `.env.local`)

If you already have `.env.local` with these values, skip copying.

```bash
cd calsnap-web
cp .env.e2e .env.local
```

Contents (same as `.env.e2e`):

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-calsnap
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-calsnap.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-calsnap.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
GEMINI_API_KEY=test-not-used
```

`FIREBASE_ADMIN_*` can stay empty in emulator mode.

---

# Phase 1 — Automated tests (no browser)

**Goal:** Confirm the codebase matches CI before manual testing.

**Time:** ~5–15 minutes  
**Firebase cloud:** Not needed  
**Terminals:** 1

### Steps

```bash
cd calsnap-web
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm test:integration
pnpm test:e2e
```

Optional secret audit (CI runs this after build):

```bash
! grep -rq GEMINI_API_KEY .next/static && echo "OK: no Gemini key in client bundle"
```

### What each command proves

| Command | Validates |
|---------|-----------|
| `pnpm lint` | ESLint passes |
| `pnpm test` | Unit tests — nutrition math, validation, parsers, etc. |
| `pnpm build` | Production Next.js + Serwist PWA build (`--webpack`) |
| `pnpm test:integration` | Firestore + Storage **security rules** via emulators |
| `pnpm test:e2e` | Full happy path in Chromium (signup → onboarding → scan → log → weigh-in); **mocks** `/api/analyze-meal` |

E2E flow covered by `tests/e2e/happy-path.spec.ts`:

1. Email signup
2. Five-step onboarding
3. Scan tab → upload test photo → mocked analysis
4. Log meal → dashboard shows meal
5. Weigh-in sheet → save

### Phase 1 checklist

- [ ] All commands exit 0
- [ ] No Java errors during `test:integration` or `test:e2e`
- [ ] If E2E fails: run `pnpm exec playwright install chromium` once, then retry

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `java: command not found` | Install Java 21+ |
| Port 8080/9099/9199/4000 in use | Stop other emulator instances; `lsof -i :8080` |
| Playwright browser missing | `pnpm exec playwright install --with-deps chromium` |
| `test:e2e` hangs | Ensure no stale `pnpm dev` on port 3000 |

**Gate:** Do not proceed to Phase 2 until Phase 1 is green (or you have a documented reason a failure is environmental).

---

# Phase 2 — Manual QA on emulators

**Goal:** Click through every feature in the browser; debug UX and data flows.

**Time:** 30–60 minutes  
**Firebase cloud:** Not needed — local emulators only  
**Terminals:** 2

### Start the stack

**Terminal 1 — emulators (leave running):**

```bash
cd calsnap-web
pnpm emulators
```

Wait until you see the Emulator UI URL: **http://localhost:4000**

**Terminal 2 — Next.js:**

```bash
cd calsnap-web
pnpm dev
```

Open **http://localhost:3000**

Confirm `.env.local` has `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (see [Environment files](#environment-files)).

### Manual test script

Use a **fresh email** each run (e.g. `you+test1@example.com`) so onboarding is not skipped.

#### Auth & onboarding

- [ ] `/signup` — create account with email + password
- [ ] Redirected to `/onboarding`
- [ ] Complete all 5 steps (welcome → profile → goal → calorie preview → done)
- [ ] Land on dashboard with calorie target visible
- [ ] Emulator UI → Firestore → `users/{uid}/profile/main` document exists
- [ ] Sign out (Settings) → `/login` → sign back in → skips onboarding, goes to dashboard
- [ ] Google sign-in — **skip for now** (test in Phase 4/5 on a real domain)

#### Dashboard

- [ ] Calorie ring shows consumed / target / remaining
- [ ] Macro bars render
- [ ] Empty meals state or meal list
- [ ] Weight sparkline (empty or with data)
- [ ] Scan FAB / tab navigates to `/scan`
- [ ] Bottom tab nav: Dashboard, Log, Scan, Progress, Settings

#### Meal scanner (without real Gemini)

With `GEMINI_API_KEY=test-not-used`, scan will fail at analysis — that's expected in Phase 2.

- [ ] `/scan` — upload a photo from gallery (or use file input)
- [ ] Analysis fails gracefully (503 or error banner) — **expected**
- [ ] **Manual meal entry** fallback — add items manually and log
- [ ] Meal appears on dashboard and in Log tab

#### Meal log (W05)

- [ ] `/log` — meals grouped by type
- [ ] Tap meal → detail view
- [ ] Edit meal → save → totals update on dashboard
- [ ] Delete meal → confirm → removed from dashboard
- [ ] Share card renders (if applicable)

#### Progress (W06)

- [ ] `/progress` — chart, stats, history
- [ ] Log weigh-in → TDEE / daily target updates on dashboard
- [ ] History list shows new entry (newest first)

#### Analytics (W07)

- [ ] `/analytics` — timeframe picker (7D / 30D / 90D)
- [ ] Sections render (may be sparse with little data)
- [ ] Insight generation — **skip until Phase 3** (needs real Gemini key)

#### Settings (W08)

- [ ] Edit profile → dashboard reflects new targets
- [ ] Macro sliders (sum = 100%)
- [ ] Units toggle (metric / imperial display)
- [ ] Export CSV downloads
- [ ] About / privacy link → `/privacy` loads
- [ ] Delete all data → confirm → user data cleared (re-onboard on next visit)

#### PWA / misc (partial — full PWA needs HTTPS in Phase 5)

- [ ] `/privacy` public page loads without login
- [ ] Layout OK at narrow width (320px devtools)
- [ ] Install prompt — **defer to Phase 5** on real HTTPS host

### Emulator debugging tips

- **Emulator UI** (http://localhost:4000): inspect Auth users, Firestore docs, Storage files
- **Reset data:** stop emulators (Ctrl+C) and restart `pnpm emulators`
- **Session issues:** clear site cookies for `localhost:3000`; sign in again
- **Permission denied:** rules are enforced — check you're signed in as the doc owner

### Phase 2 checklist

- [ ] Signup → onboarding → dashboard works
- [ ] Manual meal log works (without AI)
- [ ] Meal edit/delete updates dashboard
- [ ] Weigh-in updates targets
- [ ] Settings export and delete work
- [ ] No unexplained console errors on happy paths

**Gate:** Fix bugs found here before Phase 3. File issues or fix in code as needed.

---

# Phase 3 — Real Gemini locally

**Goal:** Validate meal scanner and analytics insights against the real Gemini API.

**Time:** ~15 minutes  
**Firebase cloud:** Still not needed (keep emulators)  
**Terminals:** 2 (same as Phase 2)

### Setup

1. Keep emulators + `pnpm dev` running (or restart both).
2. Edit `.env.local` — replace only:

```env
GEMINI_API_KEY=<your-real-key-from-aistudio>
```

3. **Restart** `pnpm dev` (env changes require restart).

### Tests

#### Meal scanner

- [ ] `/scan` — upload a clear meal photo (JPEG)
- [ ] Analysis completes in ~5–15s
- [ ] Food items, calories, confidence badge shown
- [ ] Adjust item weight → totals recalculate
- [ ] Log meal → photo in Storage emulator (`users/{uid}/meals/...` in Emulator UI)
- [ ] Dashboard totals include logged meal

#### Analytics insight

- [ ] Log meals on **3+ different days** (or adjust dates if testing allows) for meaningful analytics
- [ ] `/analytics` → generate insight
- [ ] 2–3 sentence insight returns in < ~10s

#### Error handling

- [ ] Navigate away mid-scan → no stale results applied (generation guard)
- [ ] Low-confidence banner if applicable (< 0.60)

### Phase 3 checklist

- [ ] Real scan + log works end-to-end
- [ ] Insight generation works (with enough data)
- [ ] `GEMINI_API_KEY` never appears in browser Network tab responses as a leaked secret

**Gate:** AI features validated. Ready for cloud Firebase (Phase 4) or Vercel (Phase 5).

---

# Phase 4 — Real Firebase cloud (optional but recommended)

**Goal:** Production-like Auth, Firestore, and Storage before Vercel. Catches service-account and rules-deploy issues early.

**Time:** 45–60 minutes first time  
**Skip if:** You're comfortable going straight to Vercel preview with the same Firebase project.

### 4.1 Create Firebase project

1. [Firebase Console](https://console.firebase.google.com/) → **Create project** (e.g. `calsnap-web`)
2. Note the **Project ID**
3. Enable **Blaze** if you expect heavy Storage; Spark is fine for initial testing

### 4.2 Enable products

| Product | Action |
|---------|--------|
| **Authentication** | Enable **Email/Password** and **Google** |
| **Cloud Firestore** | Create database (production mode OK — you'll deploy rules) |
| **Storage** | Create default bucket |

### 4.3 Register web app

Project Settings → Your apps → **Web** (`</>`) → register app.

Copy config into `.env.local`:

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NEXT_PUBLIC_FIREBASE_API_KEY=<from-console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com or .firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from-console>
NEXT_PUBLIC_FIREBASE_APP_ID=<from-console>
GEMINI_API_KEY=<your-real-key>
```

### 4.4 Service account (required for session cookies + API routes)

1. Project Settings → **Service accounts** → **Generate new private key**
2. From the downloaded JSON:

```env
FIREBASE_ADMIN_PROJECT_ID=<project_id>
FIREBASE_ADMIN_CLIENT_EMAIL=<client_email>
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Use literal `\n` in the private key string (the app converts them).

### 4.5 Deploy security rules

```bash
cd calsnap-web
pnpm exec firebase login
pnpm exec firebase use <your-project-id>
pnpm exec firebase deploy --only firestore:rules,storage:rules --project <your-project-id>
```

Rules files: `firestore.rules`, `storage.rules` (user-scoped under `users/{uid}/...`).

### 4.6 Authorized domains

Authentication → Settings → **Authorized domains**:

- [ ] `localhost`
- [ ] Your future Vercel domain (add now if known, e.g. `calsnap-web.vercel.app`)

### 4.7 Local smoke test (no emulators)

**Stop** `pnpm emulators`. Run only:

```bash
cd calsnap-web
pnpm dev
```

Repeat abbreviated Phase 2 + Phase 3 checks:

- [ ] Email signup → onboarding → dashboard
- [ ] Real scan + log (photo in **cloud** Storage console)
- [ ] Weigh-in, settings, export
- [ ] Google sign-in on `localhost` (if enabled)

### Phase 4 checklist

- [ ] Rules deployed (not default permissive rules)
- [ ] Session cookie flow works with admin credentials
- [ ] Data visible in Firebase Console (Firestore + Storage)
- [ ] Google sign-in works on localhost

---

# Phase 5 — Vercel deploy

**Goal:** Public HTTPS URL for mobile PWA testing and production use.

**Time:** 30–45 minutes first time  
**Requires:** Phase 4 Firebase project (or equivalent setup)

### 5.1 Import project

1. [vercel.com/new](https://vercel.com/new) → import `cal-snap` repository
2. **Root Directory:** `calsnap-web` ← required
3. Framework: **Next.js**
4. Build: `pnpm build` · Install: `pnpm install` · Node: **22**

### 5.2 Environment variables

Vercel → Project → **Settings → Environment Variables**

Add for **Production** and **Preview**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From config |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | `false` |
| `FIREBASE_ADMIN_PROJECT_ID` | Service account |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Private key with `\n` |
| `GEMINI_API_KEY` | Google AI Studio key |

**Never** set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` on Vercel.

### 5.3 Deploy

Push to main or:

```bash
cd calsnap-web
npx vercel        # preview
npx vercel --prod # production
```

### 5.4 Post-deploy Firebase

1. Copy your Vercel URL (e.g. `https://calsnap-web-xxx.vercel.app`)
2. Firebase Console → Authentication → **Authorized domains** → add it
3. Re-test **Google sign-in** on that URL
4. Confirm rules still deployed to the same project ID as env vars

### 5.5 Production manual QA (from PR-W10)

Test on **real mobile devices** where possible.

| # | Test | Pass? |
|---|------|-------|
| 1 | Add to Home Screen — iOS Safari | |
| 2 | Add to Home Screen — Android Chrome | |
| 3 | PWA standalone opens logged-in dashboard | |
| 4 | Weigh-in reminder banner when 7+ days overdue | |
| 5 | Mobile Lighthouse baseline (record scores) | |
| 6 | Keyboard does not cover inputs (auth, onboarding, settings, weigh-in) | |
| 7 | 320px width + 200% text zoom — layout holds | |
| 8 | `/privacy` accurate vs actual practices | |
| 9 | All Vercel env vars set correctly | |

Repeat core flows on preview URL:

- [ ] Signup / login (email + Google)
- [ ] Onboarding
- [ ] Scan → log (real Gemini)
- [ ] Edit / delete meal
- [ ] Weigh-in → dashboard target update
- [ ] Analytics insight
- [ ] Settings export + delete data

### Phase 5 checklist

- [ ] Preview deploy succeeds
- [ ] Login works (no redirect loop)
- [ ] Scanner works on mobile Safari / Chrome
- [ ] PWA install tested on at least one device
- [ ] Production deploy promoted when preview is signed off

---

## Quick reference — commands

```bash
cd calsnap-web

# Phase 1
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e

# Phase 2–3
pnpm emulators          # terminal 1
pnpm dev                # terminal 2

# Phase 4
pnpm exec firebase deploy --only firestore:rules,storage:rules --project <id>

# Phase 5
npx vercel
npx vercel --prod
```

---

## Troubleshooting — common deploy issues

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login succeeds then kicks to `/login` | Missing/malformed `FIREBASE_ADMIN_*` on Vercel | Re-paste private key with `\n` |
| `Permission denied` on Firestore | Rules not deployed or wrong `projectId` | `firebase deploy --only firestore:rules` |
| Storage upload fails | Storage rules not deployed or bucket mismatch | Deploy storage rules; check `STORAGE_BUCKET` env |
| Google sign-in fails after redirect | Domain not authorized | Add Vercel URL to Firebase authorized domains |
| Scanner 503 | `GEMINI_API_KEY` missing on Vercel | Add server env var; redeploy |
| Preview URL Google auth fails | Each preview subdomain may need authorization | Use email/password on previews; test Google on production domain |
| PWA install missing | Not HTTPS or manifest/SW issue | Vercel provides HTTPS; check build used `--webpack` |

---

## Security checklist (before sharing URL publicly)

- [ ] `GEMINI_API_KEY` and `FIREBASE_ADMIN_*` are server-only (not `NEXT_PUBLIC_*`)
- [ ] `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` on Vercel
- [ ] Firestore + Storage rules deployed (user-scoped)
- [ ] `.env.local` never committed
- [ ] Service account JSON file deleted from Downloads after copying to Vercel

---

## Where to get help

- **Implementation details:** `docs/implementation/web/PR-W01.md` … `PR-W10.md`
- **CI parity:** `.github/workflows/calsnap-web.yml`
- **Env template:** `calsnap-web/.env.local.example`

When working through this guide with an agent, start at **Phase 1** and report pass/fail for each phase before advancing.
