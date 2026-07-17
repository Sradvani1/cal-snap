import SwiftUI
import SwiftData

@main
struct CalSnapApp: App {
    @State private var appContainer = AppContainer()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appContainer)
        }
        .modelContainer(for: [UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self])
    }
}
