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

    func refresh(meal: MealEntry, context: ModelContext) {
        do {
            self.meal = try mealRepository.fetchMeal(id: meal.id, context: context) ?? meal
            loadError = nil
        } catch {
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
