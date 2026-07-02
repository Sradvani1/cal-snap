# CalSnap Web — Implementation Docs

Implementation checklists for the CalSnap Web PR series live here. Each merged PR adds a `PR-W0N.md` file mirroring the iOS format in [`../PR-01.md`](../PR-01.md).

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

- **[ROLLOUT.md](./ROLLOUT.md)** — phased guide: emulator testing → real Gemini → Firebase cloud → Vercel

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

Sprint plan: [OPTIMIZATION-MASTER-PLAN.md](./OPTIMIZATION-MASTER-PLAN.md) · [PERF-BASELINE.md](./PERF-BASELINE.md) · [.cursor/plans/web_optimization_sprint_68cb0f71.plan.md](../../.cursor/plans/web_optimization_sprint_68cb0f71.plan.md)

**Optimization sprint code-complete; operator manual QA Pending** (WR07/WR08/WO05 §8).

## Source of truth

- [`docs/technical-spec.md`](../../technical-spec.md) — architecture, models, services
- [`docs/product-research.md`](../../product-research.md) — product and science
- [`docs/engineering-rules.md`](../../engineering-rules.md) — scope discipline
- [`.cursor/plans/calsnap_web_prs_4a5e9349.plan.md`](../../.cursor/plans/calsnap_web_prs_4a5e9349.plan.md) — 10-PR roadmap
