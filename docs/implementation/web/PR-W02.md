# PR W02: Firebase Auth and Onboarding

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w02_auth_onboarding_72c95ddd.plan.md`](../../../.cursor/plans/pr_w02_auth_onboarding_72c95ddd.plan.md), [`docs/technical-spec.md`](../../technical-spec.md) (PR 2), [PR-W01](./PR-W01.md)

---

## 1. Objective

Add Firebase Authentication (email + Google redirect), session middleware, a five-step onboarding wizard, Firestore profile persistence at `users/{uid}/profile/main`, security rules, and a dashboard stub. Mirrors iOS PR-02 with HealthKit and API key steps removed.

---

## 2. In scope

- Firebase Auth: email/password + Google (`signInWithRedirect` only)
- Session cookie (`__session`, httpOnly) via `firebase-admin` + `/api/auth/session`
- `middleware.ts` session verification (jose on Edge; admin in API route)
- Firestore profile doc + security rules
- Five-step onboarding: welcome → profile → goal → calorie preview → done
- Client layout guards for onboarding completion
- Dashboard stub (greeting + daily calorie target)
- Vitest: validation + repository unit tests; optional integration test with emulators

---

## 3. Out of scope

- Dashboard ring, meals, tabs (W03)
- TanStack Query, shadcn/ui (W09)
- Gemini API routes (W04)
- Meal/weigh-in collections (W04/W06)
- Password reset, email verification (W08)
- iOS tree changes

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `firestore.rules` | Owner-only read/write on `users/{uid}/profile/*` |
| `lib/firebase/admin.ts` | Lazy firebase-admin init (server-only) |
| `lib/firebase/emulator.ts` | Connect client SDK to Auth/Firestore emulators |
| `lib/auth/auth-context.tsx` | AuthProvider + session establishment |
| `lib/auth/use-auth.ts` | Auth hook re-export |
| `lib/auth/session-edge.ts` | Edge-compatible session JWT verification |
| `app/api/auth/session/route.ts` | POST/DELETE session cookie |
| `middleware.ts` | Session gate for auth/app/onboarding routes |
| `lib/models/profile-doc.ts` | Firestore profile document type |
| `lib/repositories/profile.ts` | Draft→profile, doc mappers, Firestore CRUD |
| `lib/utilities/unit-formatters.ts` | kg/lbs, cm/ft-in conversions |
| `lib/onboarding/*` | Steps, draft, validation, use-onboarding hook |
| `components/onboarding/*` | Five step UI components |
| `app/(auth)/*` | Login + signup pages |
| `app/(onboarding)/*` | Onboarding wizard |
| `app/(app)/*` | Dashboard stub + onboarding guard |
| `tests/unit/onboarding-validation.test.ts` | Age/goal date validation |
| `tests/unit/profile-repository.test.ts` | Calculator parity + macro defaults |
| `tests/integration/profile-firestore.test.ts` | Rules round-trip (optional) |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `firebase.json` | Firestore rules path |
| `.env.local.example` | Emulator flag + admin credentials |
| `lib/firebase/client.ts` | Emulator connect on auth/firestore getters |
| `app/layout.tsx` | Wrap with AuthProvider |
| `app/page.tsx` | Root redirect resolver |
| `package.json` | firebase-admin, jose, rules-unit-testing, emulator scripts |
| `next.config.ts` | serverExternalPackages for firebase-admin |

---

## 6. Tests

### Unit (merge gate)

| File | Cases |
|------|-------|
| `onboarding-validation.test.ts` | Age 10 rejected; 35 accepted; goal 7d rejected; 14d accepted; name optional |
| `profile-repository.test.ts` | Macro defaults 0.28/0.47/0.25; TDEE/target > 0; calculator parity |

### Integration (optional)

```bash
pnpm test:integration
```

Requires Firebase emulators via `firebase emulators:exec`.

---

## 7. Acceptance criteria

| Criterion | Satisfied by |
|-----------|--------------|
| Email + Google auth | login/signup + Firebase providers |
| Session middleware blocks `(app)` without session | `middleware.ts` |
| Five-step onboarding saves profile | `saveProfileFromDraft` on calorie preview continue |
| `onboardingCompleted: true` after save | ProfileDoc field |
| Returning user skips onboarding | `(onboarding)/layout` guard |
| Dashboard stub shows daily target | `(app)/dashboard/page.tsx` |
| Goal date min 2 weeks | `validation.ts` + unit test |
| Deficit slider 250–500, 750 with acknowledgment | `use-onboarding` + CalorieTargetPreviewStep |
| No secrets in client bundle | firebase-admin server-only |

---

## 8. Manual test plan

1. Copy `.env.local.example` → `.env.local`; set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` and Firebase client vars for `demo-calsnap`
2. Terminal 1: `pnpm emulators`
3. Terminal 2: `pnpm dev`
4. Sign up → complete onboarding → land on dashboard stub
5. Sign out → sign in → skip onboarding → dashboard
6. Verify Firestore doc at `users/{uid}/profile/main`

---

## 9. Pull request

**Title:** PR W02: Firebase Auth and onboarding

**Summary**

- Adds email/Google auth, session middleware, five-step onboarding, Firestore profile at `users/{uid}/profile/main`, security rules, and dashboard stub.
- Web deltas: cloud profile with `onboardingCompleted` and unit prefs; Google uses redirect-only flow.

**Test plan**

```bash
cd calsnap-web
pnpm install
pnpm test
pnpm lint
pnpm build
```

Manual: emulators → signup → onboarding → dashboard stub; relaunch skips onboarding.
