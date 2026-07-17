# PR WR09: Auth Reset (Ultra-Minimal Firebase)

**Status:** Implemented  
**Sprint:** Auth simplification reset  
**Reverts architecture from:** [PR-WR02.md](./PR-WR02.md) (session cookies, middleware, dual verify)  
**Plan:** `.cursor/plans/auth_simplification_reset_a17e0b2c.plan.md`

---

## Summary

Production Safari Google login looped because three auth mechanisms competed: Firebase client SDK, httpOnly `__session` cookie, and edge middleware. WR09 deletes the entire session/middleware stack and uses:

| Layer | Mechanism |
|-------|-----------|
| Pages | Firebase Auth SDK only (`auth-context.tsx`) |
| Route protection | Client-only `useRequireAuth()` in `(app)/layout` |
| Onboarding gate | `useProfile()` — not auth-layer helpers |
| API routes (2) | `Authorization: Bearer` + `admin.verifyIdToken()` |

**Auth lib files:** 2 — `lib/auth/auth-context.tsx`, `lib/auth/verify-bearer-token.ts`

---

## Deleted

- `middleware.ts`
- `app/api/auth/session/`
- `session-edge.ts`, `verify-api-session.ts`
- Race/workaround files: `auth-redirect-state`, `wait-for-first-auth-event`, `auth-bootstrap`, `google-redirect`, `google-sign-in-strategy`, `navigate-after-auth`, `use-auth`
- `firebase-auth-errors.ts` (merged into `auth-context.tsx`)
- `SessionErrorBanner.tsx` (replaced by `InlineErrorMessage` for non-auth errors)
- `app/page.tsx` — root `/` redirects to `/dashboard` via `next.config.ts`
- `jose` dependency

---

## Routing

| URL | Behavior |
|-----|----------|
| `/` | `next.config` redirect → `/dashboard` |
| `/dashboard` (no user) | `useRequireAuth` → `/login` |
| `/dashboard` (no onboarding) | → `/onboarding` |
| `/login` after auth | Profile fetch → `/dashboard` or `/onboarding` |
| Google OAuth | `signInWithRedirect` only; returns to `/login` |

**Rule:** Never redirect inside global `onAuthStateChanged`. Login/signup pages redirect via `useEffect` + `useProfile`.

---

## Sign out

`AuthProvider` accepts `onSignOut={() => queryClient.clear()}` from `AppProviders` — clears TanStack cache on shared devices.

---

## API auth

Client (2 call sites):

```typescript
headers: { Authorization: `Bearer ${await user.getIdToken()}` }
```

Server: `verify-bearer-token.ts` → `getAdminAuth().verifyIdToken(token, true)`.

`AuthProvider` surfaces Google redirect failures as `authError` on login/signup pages.

---

## Production checklist

| Check | Where |
|-------|-------|
| `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY` on Vercel | Vercel env |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` on Vercel | Vercel env |
| `GEMINI_API_KEY` set | Vercel env |
| Production URL in Firebase **Authorized domains** | Firebase Console → Auth → Settings |
| Google sign-in provider **enabled** | Firebase Console → Auth → Sign-in method |
| Redeploy after env var changes | Vercel |
| Google OAuth starts from **`/login`** | Code — redirect returns to same URL |

See also [ROLLOUT.md](./ROLLOUT.md) §4.4, §5.2.

---

## Manual QA (Safari private window)

Operator runs after deploy:

1. Google redirect login → dashboard or onboarding, **no loop**
2. Email login → same
3. Sign out → `/login`; dashboard blocked; **no stale data** on re-login
4. `/` bookmark → dashboard (if logged in)
5. Meal scan + insight generation work
6. Refresh `/dashboard` while logged in → stays

---

## Merge gate

```bash
cd calsnap-web
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

---

## Files changed

| Area | Files |
|------|-------|
| Auth core | `auth-context.tsx`, `verify-bearer-token.ts` |
| Layouts | `(app)/layout.tsx`, `(onboarding)/layout.tsx`, login/signup |
| Config | `next.config.ts` (redirect `/` → `/dashboard`) |
| API | `analyze-meal/route.ts`, `generate-insight/route.ts` |
| Client fetch | `use-meal-scanner.ts`, `use-generate-insight.ts` |
| Providers | `AppProviders.tsx` |
| Docs | This file, `README.md`, privacy copy |
| Tests | Bearer unit test; route tests updated; session tests removed |

---

## Acceptance criteria

| Metric | Target |
|--------|--------|
| Auth lib files | 2 |
| Middleware | 0 |
| Session route | 0 |
| Cookie sync | 0 |
| Google login Safari | No loop (manual QA) |
| Merge gate | Green |
