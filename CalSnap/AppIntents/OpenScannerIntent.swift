import AppIntents
import Foundation

struct OpenScannerIntent: AppIntent {
    static let title: LocalizedStringResource = "Log a Meal"
    static let description = IntentDescription("Open CalSnap meal scanner")

    @MainActor
    func perform() async throws -> some IntentResult {
        AppNavigationCoordinatorStore.shared.openMealScanner()
        return .result()
    }
}

struct CalSnapShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenScannerIntent(),
            phrases: [
                "Log a meal in \(.applicationName)",
                "Open meal scanner in \(.applicationName)",
            ],
            shortTitle: "Log a Meal",
            systemImageName: "camera.fill"
        )
    }
}
