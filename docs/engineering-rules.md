# CalSnap Engineering Rules

## Stack
- iOS 26+
- Swift 6.2 (language mode 6.0 in Xcode project settings; `SWIFT_STRICT_CONCURRENCY = complete`)
- Xcode 26.x
- SwiftUI
- SwiftData
- HealthKit
- Google Gemini API
- Swift Package Manager only

## Agent skills

Installed skills under `.agents/skills/` provide Swift/SwiftUI implementation guidance:
- `swiftui-pro` — SwiftUI API, data flow, hygiene, accessibility
- `swift-language` — core Swift idioms (non-SwiftUI)
- `swiftui-performance` — rendering, observation scope, profiling
- `swiftui-navigation` — NavigationStack, sheets, deep links, Tab API

Apply relevant skills when reading, writing, or reviewing Swift/SwiftUI code.

## Architecture
- Use MVVM.
- Use `@MainActor @Observable` for view models, routers, and UI-facing services (explicit annotation — not project-wide default actor isolation, which conflicts with SwiftData `@Model` types).
- Prefer `async/await` over callback-style code; never use Grand Central Dispatch.
- Keep business logic out of views.
- Keep views thin and declarative; break large views into child `View` structs (not `@ViewBuilder` computed properties).
- Use services for external integrations.
- Use repositories for persistence access where appropriate.
- All internal units are metric: kg, cm, grams.
- Use `NavigationStack(path:)` with `Hashable` route enums and `.navigationDestination(for:)`.
- Prefer `.sheet(item:)` when presenting a model; use `.sheet(isPresented:)` only for boolean UI flags with no associated value.
- Do not nest `@Observable` routers inside other `@Observable` types.
- Each tab (if used) gets its own `NavigationStack` and independent path.
- Prefer `Tab(value:)` with `TabView(selection:)` over legacy `.tabItem { }`.

## Scope discipline
- Build only what is required for the current PR.
- Do not implement future PR features early.
- **PR1 exception:** Implement the full `NutritionCalculator` API (including `weightProjection` and `isOnPlateau`) and all four SwiftData models even though UI for those features arrive in later PRs. PR1 must not add UI, services, or integrations beyond the blank `RootView` placeholder.
- Do not add extra abstractions unless they clearly reduce complexity in the current PR.
- Do not introduce third-party dependencies unless explicitly requested in the spec for that PR. **PR1 adds no SPM packages.**

## Code quality
- Prefer simple, readable code over clever code.
- Use descriptive naming.
- Use `guard` with shorthand unwrap (`guard let value else`) and early returns.
- Handle edge cases explicitly.
- Avoid force unwraps and force `try`; use `guard`, nil-coalescing, or typed error handling.
- Avoid dead code, placeholders, and TODO sprawl.
- Non-view Swift files using Foundation types (`UUID`, `Date`, `Data`, `Calendar`, etc.) must `import Foundation` explicitly.
- Prefer if/switch expressions for simple conditional values.
- Prefer `count(where:)`, `contains(where:)`, and modern collection APIs over manual loops.
- Prefer `FormatStyle` / `Text(_, format:)` over `DateFormatter`/`NumberFormatter` in views.
- Prefer `Date.now` over `Date()`.
- Default to `some` over `any` for opaque types.
- Use typed throws (`throws(SomeError)`) when a function has a single, clear error domain.
- Types crossing concurrency boundaries must be `Sendable`.

## SwiftUI & UI
- Follow the technical spec exactly unless a contradiction or issue is found.
- Prefer system-native iOS patterns and Apple's Human Interface Guidelines.
- Keep the UX simple, calm, and fast.
- Icon-only buttons must include a text label; use `.labelStyle(.iconOnly)` when visually icon-only.
- Support Dynamic Type; use `.font(.body.scaled(by:))` for custom scaling on iOS 26+.
- Respect Reduce Motion for non-essential animations (prefer opacity over motion).
- Do not use `onTapGesture` for primary actions — use `Button`.
- Do not allocate formatters or sort/filter collections inside view `body`.
- Use `LazyVStack`/`List` for long scrollable content; precompute filtered/sorted data in the view model.
- Prefer `task {}` over `onAppear {}` for async load work.
- Use `.presentationSizing(.form)` (or `.page`/`.fitted`) for sheet sizing — do not hard-code frame dimensions.
- Prefer `foregroundStyle()` over deprecated `foregroundColor()`.

## Performance
- Profile performance issues on Release builds with Instruments (SwiftUI template).
- Use `Self._printChanges()` in DEBUG when diagnosing unnecessary view updates.
- Narrow `@Observable` observation scope by splitting child views.
- Prefer ternary modifier expressions over `if`/`else` view branching when only a modifier value changes.

## Documented exceptions
- UIKit bridges are allowed for camera (`PhotosUI`), sharing (`UIActivityViewController`), and widgets.
- HealthKit background writes may use `try?` and must not block UI or show user-facing errors (log only).
- `withCheckedThrowingContinuation` is acceptable only when wrapping legacy HealthKit APIs without async equivalents.
- `NWPathMonitor` requires a `DispatchQueue` for `start(queue:)` — use a private serial queue with a `@Sendable` resume guard (see `MealScannerViewModel.isNetworkAvailable`).

## Testing
- Write unit tests for business logic in each PR.
- Add tests before or alongside implementation for all nontrivial logic.
- All tests must pass before declaring the PR complete.
- UI tests only where unit tests are not possible.
- **PR1:** Unit-test `NutritionCalculator` and `KeychainManager` only. No UI tests, snapshot tests, or SwiftData integration tests required unless added explicitly in the PR1 spec.

## Security
- Never hardcode API keys.
- Store secrets in Keychain only.
- Do not store secrets in `UserDefaults`, source files, or plist files.
- `@AppStorage` must never store passwords or API keys.

## Output expectations for Cursor
When asked to plan:
- Do not code.
- Produce a file-by-file plan.
- Call out assumptions, blockers, risks, and open questions.

When asked to implement:
- Implement only the approved PR scope.
- State which files are being created or modified.
- Apply relevant agent skills for API choice, navigation, and performance.
- Run or specify tests relevant to the changes.
- Summarize what remains incomplete, if anything.

## Conflict resolution
If the docs conflict:
1. `technical-spec.md` controls implementation details.
2. `product-research.md` controls product rationale and science assumptions.
3. `engineering-rules.md` controls coding behavior and scope discipline.
4. Agent skills under `.agents/skills/` provide implementation guidance and must not override stack constraints or PR scope in this file.
5. Stop and surface contradictions instead of guessing.
