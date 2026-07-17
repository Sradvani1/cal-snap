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

extension Array where Element == DashboardRoute {
    mutating func removeRoutes(forMealId mealId: UUID) {
        removeAll { route in
            switch route {
            case .mealDetail(let id):
                id == mealId
            case .mealScanner(.edit(let id)):
                id == mealId
            default:
                false
            }
        }
    }
}
