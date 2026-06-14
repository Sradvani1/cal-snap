# CalSnap Engineering Rules

## Stack
- iOS 17+
- Swift 5.10
- SwiftUI
- SwiftData
- HealthKit
- Google Gemini API
- Swift Package Manager only

## Architecture
- Use MVVM.
- Use `@Observable` for view models.
- Prefer `async/await` over callback-style code.
- Keep business logic out of views.
- Keep views thin and declarative.
- Use services for external integrations.
- Use repositories for persistence access where appropriate.
- All internal units are metric: kg, cm, grams.

## Scope discipline
- Build only what is required for the current PR.
- Do not implement future PR features early.
- **PR1 exception:** Implement the full `NutritionCalculator` API (including `weightProjection` and `isOnPlateau`) and all four SwiftData models even though UI for those features arrives in later PRs. PR1 must not add UI, services, or integrations beyond the blank `RootView` placeholder.
- Do not add extra abstractions unless they clearly reduce complexity in the current PR.
- Do not introduce third-party dependencies unless explicitly requested in the spec for that PR. **PR1 adds no SPM packages.**

## Code quality
- Prefer simple, readable code over clever code.
- Use descriptive naming.
- Use guard clauses and early returns.
- Handle edge cases explicitly.
- Avoid force unwraps unless impossible to fail and clearly justified.
- Avoid dead code, placeholders, and TODO sprawl.

## Testing
- Write unit tests for business logic in each PR.
- Add tests before or alongside implementation for all nontrivial logic.
- All tests must pass before declaring the PR complete.
- **PR1:** Unit-test `NutritionCalculator` and `KeychainManager` only. No UI tests, snapshot tests, or SwiftData integration tests required unless added explicitly in the PR1 spec.

## Security
- Never hardcode API keys.
- Store secrets in Keychain only.
- Do not store secrets in `UserDefaults`, source files, or plist files.

## UI
- Follow the technical spec exactly unless a contradiction or issue is found.
- Prefer system-native iOS patterns.
- Keep the UX simple, calm, and fast.

## Output expectations for Cursor
When asked to plan:
- Do not code.
- Produce a file-by-file plan.
- Call out assumptions, blockers, risks, and open questions.

When asked to implement:
- Implement only the approved PR scope.
- State which files are being created or modified.
- Run or specify tests relevant to the changes.
- Summarize what remains incomplete, if anything.

## Conflict resolution
If the docs conflict:
1. `technical-spec.md` controls implementation details.
2. `product-research.md` controls product rationale and science assumptions.
3. `engineering-rules.md` controls coding behavior and scope discipline.
4. Stop and surface contradictions instead of guessing.