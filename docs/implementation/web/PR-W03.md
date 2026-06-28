# PR W03: Dashboard — Core Daily View

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w03_dashboard_948f8c82.plan.md`](../../../.cursor/plans/pr_w03_dashboard_948f8c82.plan.md), [PR-W01](./PR-W01.md), [PR-W02](./PR-W02.md)

---

## 1. Objective

Replace the W02 dashboard stub with the full daily home screen: calorie ring, macro/fiber bars, today's meals, weight sparkline, plateau sheet, scan FAB, and bottom tab navigation. Wire live Firestore reads via TanStack Query v5.

---

## 2. In scope

- `@tanstack/react-query` + `AppProviders` (QueryClient wraps AuthProvider)
- Firestore `MealEntryDoc` / `WeighInDoc` types, mappers, rules, `firestore.indexes.json`
- Pure dashboard logic in `lib/dashboard/*` with unit tests
- Read-only repos: `meals.ts`, `weigh-ins.ts`; `updateCalorieTargets` on profile repo
- Query hooks: `useProfile`, `useTodaysMeals`, `useRecentWeighIns`, `useDashboard`
- Dashboard UI components under `components/dashboard/`
- App shell: bottom tab nav, stub pages (Log W05, Scan W04, Progress W06, Settings W08)
- Plateau sheet with Diet Break / Small Reduction / Remind Later; snooze/maintenance in `localStorage` per uid
- Calendar-day boundaries via browser local timezone (`lib/dashboard/date-window.ts`)

---

## 3. Out of scope

- Gemini scanner / meal writes (W04)
- Meal CRUD / log detail (W05)
- Weigh-in sheet / full progress charts (W06)
- Analytics (W07)
- Settings beyond stub + sign out (W08)
- shadcn / design tokens (W09)
- PWA / E2E (W10)

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `components/providers/AppProviders.tsx` | QueryClient + Auth wrapper |
| `lib/queries/*` | Query client, keys, hooks |
| `lib/models/meal-entry-doc.ts` | Meal Firestore doc + mappers |
| `lib/models/weigh-in-doc.ts` | Weigh-in Firestore doc + mappers |
| `lib/dashboard/*` | Aggregation, progress bands, plateau, date helpers |
| `lib/repositories/meals.ts` | Read today's meals |
| `lib/repositories/weigh-ins.ts` | Chart + plateau weigh-in reads |
| `components/dashboard/*` | Ring, macros, meals, chart, footer, plateau, FAB, header |
| `components/app/BottomTabNav.tsx` | Five-tab bottom nav |
| `components/app/StubPage.tsx` | Shared stub layout |
| `app/(app)/log|scan|progress|settings/page.tsx` | Stub routes |
| `firestore.indexes.json` | Meals `timestamp` range index |
| `tests/unit/dashboard-aggregation.test.ts` | Core logic tests |
| `tests/integration/dashboard-firestore.test.ts` | Optional emulator tests |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `package.json` | `@tanstack/react-query` |
| `app/layout.tsx` | `AppProviders` |
| `app/(app)/layout.tsx` | Bottom nav + `pb-20` |
| `app/(app)/dashboard/page.tsx` | Full wired dashboard |
| `lib/repositories/profile.ts` | `updateCalorieTargets`, `getProfileWithExtras` |
| `lib/models/index.ts` | Export doc types |
| `firestore.rules` | Meals + weighIns subcollections |
| `firebase.json` | Indexes path |
| `middleware.ts` | Protect all app tab routes |

---

## 6. Tests

### Unit (merge gate)

```bash
cd calsnap-web && pnpm test
```

Covers meal aggregation, calorie/fiber progress bands, net calorie summary, plateau gating, diet break / small reduction target math.

### Integration (optional)

```bash
pnpm test:integration
```

Seeds meals and weekly-spaced weigh-ins in emulators; verifies repo queries.

### Merge gate

```bash
cd calsnap-web && pnpm install && pnpm test && pnpm lint && pnpm build
```

---

## 7. Manual test plan

1. `pnpm emulators` + `pnpm dev` with `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`
2. Complete onboarding → empty dashboard (ring at 0/target, empty meals, empty weight chart)
3. In Emulator UI, add 3 meals under `users/{uid}/meals/` for today → refresh → ring/macros update
4. Add 3 weekly-spaced weigh-ins with flat weights → plateau sheet appears
5. Diet Break → target equals TDEE; sheet dismisses; maintenance suppresses re-alert for 14 days
6. Resize to 320px → tab bar usable; FAB above nav
7. Navigate all 5 tabs; sign out from Settings only

---

## 8. Web deltas vs iOS PR-03

| Area | iOS | Web W03 |
|------|-----|---------|
| Data layer | SwiftData + `@Observable` VM | TanStack Query + pure `lib/dashboard` |
| Plateau snooze/maintenance | AppStorage per profile UUID | `localStorage` keys per Firebase uid |
| Weight chart | Swift Charts | Inline SVG sparkline |
| Scan entry | FAB → MealScannerView stub | FAB + `/scan` tab stub |
| Tab nav | N/A (single home) | Dashboard, Log, Scan, Progress, Settings |
| Timezone | `Calendar.current` | Browser local via `date-window.ts` |

---

## 9. Pull request

**Title:** PR W03: Dashboard — core daily view

**Summary**

- Adds mobile app shell with bottom tab nav, TanStack Query, Firestore read repos for meals/weigh-ins, and the full dashboard: calorie ring, macro/fiber bars, today's meals, weight sparkline, plateau sheet, and scan FAB → `/scan` stub.

**Test plan**

```bash
cd calsnap-web
pnpm install
pnpm test
pnpm lint
pnpm build
```

Manual: emulators → onboarding → seed meals/plateau weigh-ins → verify ring aggregation and plateau actions.
