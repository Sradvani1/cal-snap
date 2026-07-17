# CalSnap

CalSnap is a progressive web app for simple calorie and macronutrient tracking from meal photos and optional text descriptions.

## Product goals
- Make calorie tracking fast enough to be sustainable.
- Use Gemini vision to estimate calories and macros from a food photo.
- Treat calorie tracking as approximate and directionally useful, not exact.
- Help users set a reasonable calorie target for gradual weight loss.
- Track intake against target and show trends over time.

## Source of truth documents
- [`docs/product-research.md`](docs/product-research.md)
- [`docs/build/README.md`](docs/build/README.md)

## Repository structure

```
cal-snap/
├── calsnap-web/          # Main app (Next.js PWA)
├── docs/                 # Product + build docs
│   ├── plans/            # PR specs and master plans
│   └── build/            # Build index, rollout, baselines
├── archive/ios/          # Archived iOS native app (for future reference)
├── .github/workflows/    # CI/CD (web)
└── README.md
```

## Web app

The main CalSnap app lives in [`calsnap-web/`](calsnap-web/). See the [web README](calsnap-web/README.md) for setup, commands, and architecture.

## Build and test

```bash
cd calsnap-web
pnpm install
pnpm dev
```

Requires Node.js 22+ and pnpm. See [`calsnap-web/README.md`](calsnap-web/README.md) for full details.

## Archived iOS app

The iOS native app source is preserved in `archive/ios/` for future development. It includes the Xcode project, Swift source, tests, and widget extension.
