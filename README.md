# CalSnap

CalSnap is a progressive web app for simple calorie and macronutrient tracking from meal photos and optional text descriptions.

## Product goals
- Make calorie tracking fast enough to be sustainable.
- Use Gemini vision to estimate calories and macros from a food photo.
- Treat calorie tracking as approximate and directionally useful, not exact.
- Help users set a reasonable calorie target for gradual weight loss.
- Track intake against target and show trends over time.

## Documentation

Start with the [documentation index](docs/README.md). Current guidance and completed
historical web records are kept together under root `docs/`; the original iOS app and
its platform-specific documentation remain under `archive/ios/`.

## Repository structure

```
cal-snap/
├── calsnap-web/          # Main app (Next.js PWA)
├── docs/                 # Current guidance and historical web build records
│   ├── README.md         # Architecture, operations, QA, and decisions
│   └── build/            # Completed plans, implementation records, and baselines
├── archive/ios/          # Archived iOS app and documentation
├── .github/workflows/    # CI/CD (web)
└── README.md
```

## Web app

The main CalSnap app lives in [`calsnap-web/`](calsnap-web/). See the [web README](calsnap-web/README.md) for setup and commands, and the [documentation index](docs/README.md) for system behavior.

## Build and test

```bash
cd calsnap-web
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm test:integration
pnpm dev
```

Requires Node.js 22+ and pnpm. See [`calsnap-web/README.md`](calsnap-web/README.md) for full details.

Automated verification is complete for lint, unit tests, the production webpack build,
the client-bundle secret check, and Firebase emulator integration tests. Remaining V1
work is operator validation: production smoke QA with cloud Firebase and real Gemini,
Lighthouse captures, iPhone/Safari standalone-PWA checks, and the five-profile production
preflight.

## Archived iOS app

The original iOS native app is preserved in `archive/ios/` as historical source material. It is not an active release target; see its [archive README](archive/ios/README.md).
