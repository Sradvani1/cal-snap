# CalSnap Web — Historical Build Records

> **Historical archive:** This directory records completed implementation work and release investigations. For current architecture, QA status, and deferred decisions, see [`../README.md`](../README.md).

Completed implementation checklists for the CalSnap Web PR series live in this directory alongside build records, rollout notes, and performance baselines.

All documents in this directory are historical records of completed V1 work. Their original
status text and implementation-era assumptions are preserved where useful.

## Stack (W01 baseline)

- **Framework:** Next.js App Router, TypeScript strict, Tailwind CSS
- **Tests:** Vitest (node environment)
- **Backend (W02+):** Firebase Auth, Firestore, Storage — profile at `users/{uid}/profile/main`
- **Data fetching (W03+):** TanStack Query v5 for dashboard reads
- **AI (W04+):** Gemini 2.5 Flash via Vercel Route Handlers (`GEMINI_API_KEY` server-only)
- **Package manager:** pnpm; Node 22 (`.nvmrc` and CI supported runtime)

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
| W01 | [PR-W01.md](./PR-W01.md) | Implemented |
| W02 | [PR-W02.md](./PR-W02.md) | Implemented |
| W03 | [PR-W03.md](./PR-W03.md) | Implemented |
| W04 | [PR-W04.md](./PR-W04.md) | Implemented |
| W05 | [PR-W05.md](./PR-W05.md) | Implemented |
| W06 | [PR-W06.md](./PR-W06.md) | Implemented |
| W07 | [PR-W07.md](./PR-W07.md) | Implemented |
| W08 | [PR-W08.md](./PR-W08.md) | Implemented |
| W09 | [PR-W09.md](./PR-W09.md) | Implemented |
| W10 | [PR-W10.md](./PR-W10.md) | Implemented |

## Rollout & deploy

- **[ROLLOUT.md](./ROLLOUT.md)** — historical phased guide: emulator testing → real Gemini → Firebase cloud → Vercel

## Review sprint (post-build)

- **[REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md)** — WR01–WR08 audit, debug, and polish plan

| PR | Doc | Status |
|----|-----|--------|
| WR01 | [PR-WR01.md](./PR-WR01.md) | Implemented |
| WR02 | [PR-WR02.md](./PR-WR02.md) | Implemented |
| WR03 | [PR-WR03.md](./PR-WR03.md) | Implemented |
| WR04 | [PR-WR04.md](./PR-WR04.md) | Implemented |
| WR05 | [PR-WR05.md](./PR-WR05.md) | Implemented |
| WR06 | [PR-WR06.md](./PR-WR06.md) | Implemented |
| WR07 | [PR-WR07.md](./PR-WR07.md) | Implemented |
| WR08 | [PR-WR08.md](./PR-WR08.md) | Implemented |

## Optimization sprint (native-feel polish)

| PR | Doc | Status |
|----|-----|--------|
| WO01 | [PR-WO01.md](./PR-WO01.md) | Complete (`4ea0500`) |
| WO02 | [PR-WO02.md](./PR-WO02.md) | Complete (`c2ab40f`) |
| WO03 | [PR-WO03.md](./PR-WO03.md) | Complete (`6e1a511`) |
| WO04 | [PR-WO04.md](./PR-WO04.md) | Complete |
| WO05 | [PR-WO05.md](./PR-WO05.md) | Complete |

Sprint record: [OPTIMIZATION-MASTER-PLAN.md](./OPTIMIZATION-MASTER-PLAN.md) · [PERF-BASELINE.md](./PERF-BASELINE.md)

**Optimization sprint:** completed. The original records retain their implementation-era QA notes.

## Post-sprint device fixes

| PR | Doc | Status |
|----|-----|--------|
| iPhone PWA + Settings UX | [PR-IPHONE-SAFARI-UX.md](./PR-IPHONE-SAFARI-UX.md) | Complete (code) — §8 Pending |

## Post-sprint polish

| Doc | Status |
|-----|--------|
| [MACRO-REMAINING-CALORIES.md](./MACRO-REMAINING-CALORIES.md) | Complete (`e9fbfa0`) |
| [FAT-SPLIT-BAR.md](./FAT-SPLIT-BAR.md) | Complete (HEAD) |
| [FIRESTORE-OPTIMIZATION.md](./FIRESTORE-OPTIMIZATION.md) | Complete |
| [FIRESTORE-OPTIMIZATION-PLAN.md](./FIRESTORE-OPTIMIZATION-PLAN.md) | Historical implementation plan |

## V1 deep review (post-sprint)

| Doc | Status |
|-----|--------|
| [V1-REVIEW.md](./V1-REVIEW.md) | Plan written + stress-tested; phases 0–4 implemented |
| [PHASE-02-BRITTLE-DATA-CONTRACTS.md](./PHASE-02-BRITTLE-DATA-CONTRACTS.md) | Implemented (`0819e78`) + release-blocker follow-up; automated gate passed; five-profile preflight pending |
| [PHASE-01-LOG-PAGE-RESTRUCTURE.md](./PHASE-01-LOG-PAGE-RESTRUCTURE.md) | Phase 1 implementation notes |
| [PHASE-02-BRITTLE-DATA-CONTRACTS-IMPLEMENTATION.md](./PHASE-02-BRITTLE-DATA-CONTRACTS-IMPLEMENTATION.md) | Phase 2 implementation notes |
| [PHASE-03-LATENT-BUGS-DATES.md](./PHASE-03-LATENT-BUGS-DATES.md) | Implemented; lint, unit tests, and production build passed |
| [PHASE-04-CLEANUP-DEPENDENCIES.md](./PHASE-04-CLEANUP-DEPENDENCIES.md) | Implemented; lint, unit, build, and integration verification passed |
| [PHASE-04-V1-HARDENING.md](./PHASE-04-V1-HARDENING.md) | Implemented; lint, unit, build, and integration verification passed |
| [PHASE-03-LATENT-BUGS-DATES-IMPLEMENTATION.md](./PHASE-03-LATENT-BUGS-DATES-IMPLEMENTATION.md) | Phase 3 implementation notes |

## Historical references

- [`../product-research.md`](../product-research.md) — historical iOS product and science research
- [`../README.md`](../README.md) — current web architecture and operations

The archived iOS technical spec and engineering rules are preserved in `archive/ios/docs/`.
