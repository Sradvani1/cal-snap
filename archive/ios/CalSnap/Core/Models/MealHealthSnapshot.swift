import Foundation

struct MealHealthSnapshot: Sendable, Equatable {
    let timestamp: Date
    let totalCalories: Int
    let totalProteinG: Double
    let totalCarbsG: Double
    let totalFatG: Double
    let totalFiberG: Double

    init(meal: MealEntry) {
        timestamp = meal.timestamp
        totalCalories = meal.totalCalories
        totalProteinG = meal.totalProteinG
        totalCarbsG = meal.totalCarbsG
        totalFatG = meal.totalFatG
        totalFiberG = meal.totalFiberG
    }
}
