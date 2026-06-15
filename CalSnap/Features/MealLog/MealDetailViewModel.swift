import Foundation
import SwiftData
import SwiftUI
import UIKit

@Observable
@MainActor
final class MealDetailViewModel {
    var meal: MealEntry?
    var loadError: String?

    private let mealRepository: MealRepository

    init(mealRepository: MealRepository = MealRepository()) {
        self.mealRepository = mealRepository
    }

    func load(mealId: UUID, context: ModelContext) {
        do {
            meal = try mealRepository.fetchMeal(id: mealId, context: context)
            loadError = meal == nil ? "Meal not found." : nil
        } catch {
            meal = nil
            loadError = error.localizedDescription
        }
    }

    func deleteMeal(
        meal: MealEntry,
        mealRepository: MealRepository,
        healthKitService: HealthKitService,
        context: ModelContext
    ) throws {
        try MealDeletionService.delete(
            meal: meal,
            mealRepository: mealRepository,
            healthKitService: healthKitService,
            context: context
        )
    }

    func makeShareImage() -> UIImage? {
        guard let meal else { return nil }

        let card = MealShareCardView(
            mealType: meal.mealType,
            timestamp: meal.timestamp,
            totalCalories: meal.totalCalories,
            proteinG: meal.totalProteinG,
            carbsG: meal.totalCarbsG,
            fatG: meal.totalFatG
        )

        let renderer = ImageRenderer(content: card)
        renderer.scale = UIScreen.main.scale
        return renderer.uiImage
    }
}
