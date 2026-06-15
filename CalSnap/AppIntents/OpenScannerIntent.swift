import AppIntents
import Foundation

struct OpenScannerIntent: AppIntent {
    static let title: LocalizedStringResource = "intents.openScanner.title"
    static let description = IntentDescription(LocalizedStringResource("intents.openScanner.description"))

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
            shortTitle: LocalizedStringResource("intents.openScanner.title"),
            systemImageName: "camera.fill"
        )
    }
}
