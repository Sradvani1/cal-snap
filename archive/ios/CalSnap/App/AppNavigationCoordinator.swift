import Foundation

@MainActor
@Observable
final class AppNavigationCoordinator {
    var pendingScannerRoute: MealScannerRoute?
    var shouldSelectDashboard = false

    func openMealScanner(initialMealType: MealType? = nil) {
        pendingScannerRoute = .create(initialMealType: initialMealType)
        shouldSelectDashboard = true
    }

    func consumePendingScannerRoute() -> MealScannerRoute? {
        let route = pendingScannerRoute
        pendingScannerRoute = nil
        return route
    }
}

@MainActor
final class AppNavigationCoordinatorStore {
    static let shared = AppNavigationCoordinatorStore()

    private var coordinator: AppNavigationCoordinator?

    private init() {}

    func bind(_ coordinator: AppNavigationCoordinator) {
        self.coordinator = coordinator
    }

    func openMealScanner(initialMealType: MealType? = nil) {
        coordinator?.openMealScanner(initialMealType: initialMealType)
    }
}
