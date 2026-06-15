import Foundation

enum DashboardRoute: Hashable {
    case mealDetail(UUID)
    case mealScanner(MealScannerRoute)
    case weightProgress
}

enum MealScannerRoute: Hashable {
    case create(initialMealType: MealType?)
    case edit(UUID)
}
