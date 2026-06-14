# CalSnap

CalSnap is an iOS app for simple calorie and macronutrient tracking from meal photos and optional text descriptions.

## Product goals
- Make calorie tracking fast enough to be sustainable.
- Use Gemini vision to estimate calories and macros from a food photo.
- Treat calorie tracking as approximate and directionally useful, not exact.
- Help users set a reasonable calorie target for gradual weight loss.
- Track intake against target and show trends over time.

## Source of truth documents
- `docs/product-research.md`
- `docs/technical-spec.md`
- `docs/engineering-rules.md`

## Working model
- The research doc defines product rationale and nutrition science assumptions.
- The technical spec defines architecture, models, services, views, and PR breakdown.
- `docs/engineering-rules.md` defines implementation constraints.
- PR implementation checklists live in `docs/implementation/` (e.g. `PR-01.md` for scaffold).

## Build and test

Requires Xcode 16.x and iOS 17+ simulator.

```bash
# Regenerate Xcode project after editing project.yml
xcodegen generate

# Build and run tests
xcodebuild -scheme CalSnap -destination 'platform=iOS Simulator,name=iPhone 16' test
```

Open `CalSnap.xcodeproj` in Xcode and run on an iPhone simulator to verify the blank `RootView` launches without crash.

## Build policy
Do not start coding a PR until its scope section in `docs/technical-spec.md` has been reviewed. Implementation checklists in `docs/implementation/` must not add scope beyond the spec.
