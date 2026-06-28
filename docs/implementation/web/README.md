# CalSnap Web — Implementation Docs

Implementation checklists for the CalSnap Web PR series live here. Each merged PR adds a `PR-W0N.md` file mirroring the iOS format in [`../PR-01.md`](../PR-01.md).

## Stack (W01 baseline)

- **Framework:** Next.js App Router, TypeScript strict, Tailwind CSS
- **Tests:** Vitest (node environment)
- **Backend (W02+):** Firebase Auth, Firestore, Storage — profile at `users/{uid}/profile/main`
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
| ActivityLevel UI | `localizedTitle`, `systemImage` | W09 copy module |
| Warning strings | Localized xcstrings | English literals matching iOS catalog keys |

## Open decisions

1. **Gemini cost model** — operator-funded (server `GEMINI_API_KEY`) vs per-user billing
2. **Photo retention** — indefinite Storage vs TTL / cleanup job
3. **Web Push** — in-app reminder only (W03) vs FCM in W10
4. **Account deletion** — hard delete vs grace-period soft delete

## PR index

| PR | Doc | Status |
|----|-----|--------|
| W01 | [PR-W01.md](./PR-W01.md) | Implemented |
| W02 | [PR-W02.md](./PR-W02.md) | Implemented |
| W03 | PR-W03.md | Planned |
| W04 | PR-W04.md | Planned |
| W05 | PR-W05.md | Planned |
| W06 | PR-W06.md | Planned |
| W07 | PR-W07.md | Planned |
| W08 | PR-W08.md | Planned |
| W09 | PR-W09.md | Planned |
| W10 | PR-W10.md | Planned |

## Source of truth

- [`docs/technical-spec.md`](../../technical-spec.md) — architecture, models, services
- [`docs/product-research.md`](../../product-research.md) — product and science
- [`docs/engineering-rules.md`](../../engineering-rules.md) — scope discipline
- [`.cursor/plans/calsnap_web_prs_4a5e9349.plan.md`](../../.cursor/plans/calsnap_web_prs_4a5e9349.plan.md) — 10-PR roadmap
