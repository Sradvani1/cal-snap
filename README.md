# CalSnap

CalSnap is an iOS app for simple calorie and macronutrient tracking from meal photos and optional text descriptions.

**Web app:** see [`calsnap-web/README.md`](calsnap-web/README.md).

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

Requires Xcode 26.x and iOS 26+ simulator.

```bash
# Build and run tests (use Xcode.app, not Command Line Tools alone)
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -scheme CalSnap -destination 'platform=iOS Simulator,name=iPhone 16' test
```

Open `CalSnap.xcodeproj` in Xcode and run on an iPhone simulator.

**Important:** PR2+ changes are maintained directly in `CalSnap.xcodeproj` (SPM packages, entitlements, new sources). Do **not** run `xcodegen generate` until `project.yml` is updated to match—the generator would overwrite PR2 project settings.

## Build policy
Do not start coding a PR until its scope section in `docs/technical-spec.md` has been reviewed. Implementation checklists in `docs/implementation/` must not add scope beyond the spec.
