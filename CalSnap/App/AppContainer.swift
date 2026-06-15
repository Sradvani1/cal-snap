import SwiftUI

@MainActor
@Observable
final class AppContainer {
    let healthKitService = HealthKitService()
    let geminiService = GeminiService()
    let userProfileRepository = UserProfileRepository()
    let mealRepository = MealRepository()
    let weighInRepository = WeighInRepository()
    let notificationManager = NotificationManager()
    let navigationCoordinator = AppNavigationCoordinator()

    init() {
        AppNavigationCoordinatorStore.shared.bind(navigationCoordinator)
    }
}
