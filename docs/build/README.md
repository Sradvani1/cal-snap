# CalSnap Web — Build Docs

Implementation checklists for the CalSnap Web PR series live in [../plans/](../plans/). This directory holds the build index, rollout, and performance baseline.

## Stack (W01 baseline)

- **Framework:** Next.js App Router, TypeScript strict, Tailwind CSS
- **Tests:** Vitest (node environment)
- **Backend (W02+):** Firebase Auth, Firestore, Storage — profile at `users/{uid}/profile/main`
- **Data fetching (W03+):** TanStack Query v5 for dashboard reads
- **AI (W04+):** Gemini 2.5 Flash via Vercel Route Handlers (`GEMINI_API_KEY` server-only)
- **Package manager:** pnpm; Node 20+ (`.nvmrc` pins 22 in `calsnap-web/`)

Business logic lives in `calsnap-web/lib/`; `app/` stays thin.

## Web vs iOS model deltas

| Field / concept | iOS | Web |
|-----------------|-----|-----|
| User / meal IDs | `UUID` | `string` |
| Meal photo | `photoData: Data?` | `photoStoragePath?: string` |
| Weigh-in HealthKit flag | `sourceIsHealthKit` | Omitted in W01; `source: 'manual'` in W06 if needed |
| Profile relationships | SwiftData `@Relationship` arrays | Firestore subcollections (W02+) |
| ActivityLevel storage | Codable display strings (`"Moderately Active"`) | camelCase union (`moderatelyActive`, …) |
| ActivityLevel UI | `localizedTitle`, `systemImage` | `lib/copy/` (`common.activity.*`) |
| Warning strings | Localized xcstrings | `lib/copy/` keys matching iOS catalog |

## Open decisions

1. **Gemini cost model** — operator-funded (server `GEMINI_API_KEY`) vs per-user billing
2. **Photo retention** — indefinite Storage vs TTL / cleanup job
3. **Web Push** — in-app overdue banner (W10); FCM deferred
4. **Account deletion** — immediate hard delete of user data (meals, weigh-ins, profile, Storage); Firebase Auth account retained; user re-onboards

## PR index

| PR | Doc | Status |
|----|-----|--------|
| W01 | [PR-W01.md](../plans/PR-W01.md) | Implemented |
| W02 | [PR-W02.md](../plans/PR-W02.md) | Implemented |
| W03 | [PR-W03.md](../plans/PR-W03.md) | Implemented |
| W04 | [PR-W04.md](../plans/PR-W04.md) | Implemented |
| W05 | [PR-W05.md](../plans/PR-W05.md) | Implemented |
| W06 | [PR-W06.md](../plans/PR-W06.md) | Implemented |
| W07 | [PR-W07.md](../plans/PR-W07.md) | Implemented |
| W08 | [PR-W08.md](../plans/PR-W08.md) | Implemented |
| W09 | [PR-W09.md](../plans/PR-W09.md) | Implemented |
| W10 | [PR-W10.md](../plans/PR-W10.md) | Implemented |

## Rollout & deploy

- **[ROLLOUT.md](./ROLLOUT.md)** — phased guide: emulator testing → real Gemini → Firebase cloud → Vercel

## Review sprint (post-build)

- **[REVIEW-MASTER-PLAN.md](../plans/REVIEW-MASTER-PLAN.md)** — WR01–WR08 audit, debug, and polish plan

| PR | Doc | Status |
|----|-----|--------|
| WR01 | [PR-WR01.md](../plans/PR-WR01.md) | Implemented |
| WR02 | [PR-WR02.md](../plans/PR-WR02.md) | Implemented |
| WR03 | [PR-WR03.md](../plans/PR-WR03.md) | Implemented |
| WR04 | [PR-WR04.md](../plans/PR-WR04.md) | Implemented |
| WR05 | [PR-WR05.md](../plans/PR-WR05.md) | Implemented |
| WR06 | [PR-WR06.md](../plans/PR-WR06.md) | Implemented |
| WR07 | [PR-WR07.md](../plans/PR-WR07.md) | Implemented |
| WR08 | [PR-WR08.md](../plans/PR-WR08.md) | Implemented |

## Optimization sprint (native-feel polish)

| PR | Doc | Status |
|----|-----|--------|
| WO01 | [PR-WO01.md](../plans/PR-WO01.md) | Complete (`4ea0500`) |
| WO02 | [PR-WO02.md](../plans/PR-WO02.md) | Complete (`c2ab40f`) |
| WO03 | [PR-WO03.md](../plans/PR-WO03.md) | Complete (`6e1a511`) |
| WO04 | [PR-WO04.md](../plans/PR-WO04.md) | Complete |
| WO05 | [PR-WO05.md](../plans/PR-WO05.md) | Complete |

Sprint plan: [OPTIMIZATION-MASTER-PLAN.md](../plans/OPTIMIZATION-MASTER-PLAN.md) · [PERF-BASELINE.md](./PERF-BASELINE.md)

**Optimization sprint code-complete; operator manual QA Pending** (WR07/WR08/WO05 §8).

## Post-sprint device fixes

| PR | Doc | Status |
|----|-----|--------|
| iPhone PWA + Settings UX | [PR-IPHONE-SAFARI-UX.md](../plans/PR-IPHONE-SAFARI-UX.md) | Complete (code) — §8 Pending |

## Post-sprint polish

| Doc | Status |
|-----|--------|
| [MACRO-REMAINING-CALORIES.md](./MACRO-REMAINING-CALORIES.md) | Complete (`e9fbfa0`) |
| [FAT-SPLIT-BAR.md](./FAT-SPLIT-BAR.md) | Complete (HEAD) |

## Source of truth

- [`docs/product-research.md`](../product-research.md) — product and science

The archived iOS technical spec and engineering rules are preserved in `archive/ios/docs/`.
