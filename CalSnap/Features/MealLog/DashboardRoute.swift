import Foundation

enum DashboardRoute: Hashable {
    case mealDetail(MealEntry)
    case mealScanner(MealScannerRoute)
}

enum MealScannerRoute: Hashable {
    case create(initialMealType: MealType?)
    case edit(MealEntry)
}

extension MealEntry {
    static func == (lhs: MealEntry, rhs: MealEntry) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

extension MealEntry: Hashable {}
