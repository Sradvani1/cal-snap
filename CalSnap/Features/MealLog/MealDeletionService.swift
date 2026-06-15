import Foundation
import SwiftData

enum MealDeletionService {
    static func delete(
        meal: MealEntry,
        mealRepository: MealRepository,
        healthKitService: HealthKitService,
        context: ModelContext
    ) throws {
        let snapshot = MealHealthSnapshot(meal: meal)
        let mealId = meal.id
        try mealRepository.delete(id: mealId, context: context)

        Task {
            do {
                try await healthKitService.reverseMeal(snapshot)
            } catch {
                print("HealthKit meal reversal failed: \(error.localizedDescription)")
            }
        }
    }
}
