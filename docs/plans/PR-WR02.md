# PR WR02: Auth, Session & Onboarding

**Status:** Implemented  
**Sprint:** Post-build review WR02 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md))  
**Depends on:** [PR-WR01.md](./PR-WR01.md) (merge gate green, E2E helpers)  
**Reviews:** [PR-W02.md](./PR-W02.md) original W02 acceptance criteria

---

## 1. Audit checklist

### 1.1 Email auth + session cookie

| Scope item | Result |
|------------|--------|
| Signup → `POST /api/auth/session` → `__session` httpOnly cookie set | Pass |
| Login → same; middleware allows `/dashboard` on next navigation | Pass |
| Logout → `DELETE /api/auth/session` + Firebase `signOut` | Pass |
| Unauthenticated `/dashboard` → `/login` | Pass |
| Authenticated `/login` → `/` (root resolver) | Pass |
| Session cookie `maxAge` (5 days) aligns with verifiable session lifetime | **Fixed** — WR02-SESS-01 |
| Email auth errors use `lib/copy` (no raw Firebase strings) | **Fixed** — WR02-AUTH-01 |

### 1.2 Google OAuth

| Scope item | Result |
|------------|--------|
| Desktop emulator: popup flow → session → routing | Pass (unit tests for UA strategy) |
| Mobile UA: redirect flow | Pass (unit tests for `shouldUseGoogleRedirect`) |
| Localhost uses Firebase-hosted auth domain | Pass (`resolve-auth-domain.ts`) |
| Production Vercel: custom domain + `/__/auth` proxy | Manual sign-off required (§8) |

### 1.3 Post-auth routing

| Scope item | Result |
|------------|--------|
| New user (no profile doc) → `/onboarding` | Pass |
| Returning user (`onboardingCompleted: true`) → `/dashboard` | Pass |
| Complete user cannot stay on `/onboarding` | Pass |
| Incomplete user cannot stay on `(app)` routes | Pass |
| Firestore read failure → restrictive redirect to onboarding | Pass — documented only (no UX fix) |

### 1.4 Onboarding wizard (5 steps)

| Scope item | Result |
|------------|--------|
| Profile persists at `users/{uid}/profile/main` with `onboardingCompleted: true` | Pass |
| Unit prefs (`useLbsForWeight`, `useImperialForHeight`) saved in doc extras | Pass |
| Goal date min 14 days | Pass (unit test exists) |
| Deficit slider bounds 250–500 + 750 unlock | Pass |
| `minAgeYears: 16` intentional web delta | Documented (§7) |

### 1.5 Imperial/metric inputs + mobile layout

| Scope item | Result |
|------------|--------|
| Imperial height → save → `heightCm` correct | Pass — unit test added (WR02-ONB-01) |
| Lbs weight round-trip | Pass (existing unit-formatters tests) |
| 320px viewport: no horizontal scroll on auth/onboarding | Manual spot-check (§8) |
| Keyboard: inputs visible when focused | Manual spot-check (§8) |

### 1.6 Firestore rules

| Scope item | Result |
|------------|--------|
| Owner-only `users/{userId}/profile/{profileId}` | Pass |
| Integration tests pass unchanged | Pass (11 tests) |

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

### Initial baseline (2026-06-30, before WR02 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **184** tests (35 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **1** test (`happy-path.spec.ts`) |

### Final merge gate (2026-06-30, after WR02 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **2** tests (`happy-path`, `login-returning-user`) |

**Net delta:** +17 unit tests, +1 E2E spec.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR02-SESS-01 | **P1** | Session | Cookie stored raw ID token (~1h JWT) with 5-day `maxAge`; middleware rejected expired JWT while cookie persisted | **Fixed** — `createSessionCookie` (prod), dual Edge verify, emulator ID-token fallback |
| WR02-AUTH-01 | **P1** | Auth | Email login/signup surfaced raw Firebase error strings | **Fixed** — `mapFirebaseAuthError()` + `lib/copy/auth.ts` keys |
| WR02-SESS-02 | P2 | Session | `session-edge.ts` projectId fallback `demo-calsnap` vs `next.config.ts` `calsnap-web` | Deferred — only matters when env unset |
| WR02-ONB-01 | P2 | Onboarding | No test for `useImperialForHeight` + `heightCm` persistence | **Fixed** — `profile-repository.test.ts` |
| WR02-ONB-02 | P3 | E2E | `completeOnboarding` uses defaults only | Intentional — imperial covered by unit test |
| WR02-GATE-01 | P3 | Layout | Firestore read failure in `(app)` layout redirects to onboarding (restrictive, no error UX) | Documented — residual risk |
| WR02-GOOG-01 | P3 | OAuth | Google OAuth untestable in CI | Manual sign-off on production Vercel (§8) |

**Open P0/P1:** None.

---

## 4. Fix list

| File | Change | Why |
|------|--------|-----|
| `app/api/auth/session/route.ts` | Production: `createSessionCookie(idToken, { expiresIn: '5d' })`; emulator: raw ID token | WR02-SESS-01 — cookie lifetime matches verifiable JWT |
| `lib/auth/session-edge.ts` | Dual verify: session-cookie issuer first, ID-token fallback; emulator decode unchanged | Edge middleware supports both cookie types |
| `lib/auth/verify-api-session.ts` | `verifySessionCookie(checkRevoked: true)` + ID-token fallback | Privileged API routes enforce revocation |
| `lib/auth/firebase-auth-errors.ts` (new) | `mapFirebaseAuthError()` with typed fallback keys | WR02-AUTH-01 — mapped codes + generic fallback for unmapped `auth/*` |
| `lib/copy/auth.ts` | 5 new `auth.errors.*` keys | Mapped email auth error strings |
| `lib/auth/auth-context.tsx` | Email/Google error mapping; popup errors via page inline only | No raw Firebase strings; no duplicate banner on popup failure |
| `lib/auth/verify-api-session.ts` | Comment on ID-token fallback | Documents emulator + migration window |
| `tests/e2e/helpers/auth.ts` | `signOut(page)` helper | Returning-user E2E exercises real settings path |
| `tests/e2e/login-returning-user.spec.ts` (new) | Merge-blocking E2E | Returning user login skips onboarding |
| `tests/unit/firebase-auth-errors.test.ts` (new) | 5 login/signup + 3 Google codes | Auth error mapping regression |
| `tests/unit/session-edge.test.ts` (new) | Emulator decode + production dual-verify | Session Edge verification |
| `tests/unit/session-route.test.ts` (new) | POST route + `verifyApiSession` | Session cookie creation + API verify |
| `tests/unit/profile-repository.test.ts` | Imperial height flag test | WR02-ONB-01 |

---

## 5. E2E helper contract updates

### Auth (`auth.ts`) — added in WR02

| Export | Signature | Usage |
|--------|-----------|-------|
| `signOut(page)` | → `void` | `gotoAppRoute('/settings')` → click `copy('settings.account.signOut')` → wait `/login` |

All other WR01 helpers unchanged. Import from `tests/e2e/helpers`.

See also [PR-WR01.md](./PR-WR01.md) §5 for the full helper contract (updated with `signOut`).

---

## 6. Acceptance criteria

- [x] Merge gate green before and after
- [x] Zero open **P0/P1** in auth/session/onboarding scope
- [x] Email signup/login → session cookie → protected routes work in emulator E2E
- [x] **New E2E:** returning user login skips onboarding (CI)
- [ ] Google OAuth manual sign-off recorded for production Vercel (§8 — pending human QA)
- [x] User-facing auth errors use `lib/copy` (no raw Firebase strings on login/signup)
- [x] 5-step onboarding saves `users/{uid}/profile/main` with `onboardingCompleted: true`
- [x] `minAgeYears: 16` documented as intentional web delta
- [x] `PR-WR02.md` complete with findings matrix + residual risks
- [x] No real Gemini in CI

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| `minAgeYears: 16` vs iOS 18 | Intentional web delta (WR01-CONST-01 carried forward) |
| Firestore gate failure UX | `(app)/layout.tsx` catch → `/onboarding` with no error message; restrictive but confusing if transient network failure |
| Google OAuth in CI | Popup/redirect logic covered by unit tests only; production sign-off required |
| Session edge cases | `onIdTokenChanged` refreshes cookie while app open; idle >5d requires re-login (expected) |
| WR02-SESS-02 | Project ID fallback mismatch when `NEXT_PUBLIC_FIREBASE_PROJECT_ID` unset |
| 320px / keyboard E2E | Deferred to WR07 viewport matrix; manual spot-check only in WR02 |
| Password reset / email verification | Out of scope (W08) |

---

## 8. Manual sign-off

### 320px spot-check (local)

| Page | 320px no horizontal scroll | Keyboard inputs visible |
|------|---------------------------|-------------------------|
| `/login` | Pending manual | Pending manual |
| `/signup` | Pending manual | Pending manual |
| `/onboarding` | Pending manual | Pending manual |

### Google OAuth (production Vercel only)

| Scenario | Environment | Signed off |
|----------|-------------|------------|
| Google popup sign-in | Desktop browser, production domain | Pending |
| Google redirect sign-in | Mobile Safari/Chrome, production domain | Pending |
| `/__/auth` handler loads | Production custom domain | Pending |
| Email signup + onboarding smoke | Production | Pending |

---

## 9. Files changed index

**New**

- `lib/auth/firebase-auth-errors.ts`
- `tests/e2e/login-returning-user.spec.ts`
- `tests/unit/firebase-auth-errors.test.ts`
- `tests/unit/session-edge.test.ts`
- `tests/unit/session-route.test.ts`
- `docs/plans/PR-WR02.md`

**Modified**

- `app/api/auth/session/route.ts`
- `lib/auth/session-edge.ts`
- `lib/auth/verify-api-session.ts`
- `lib/auth/auth-context.tsx`
- `lib/copy/auth.ts`
- `tests/e2e/helpers/auth.ts`
- `tests/e2e/helpers/index.ts`
- `tests/unit/profile-repository.test.ts`
- `.cursor/plans/pr_wr02_auth_onboarding.plan.md`
