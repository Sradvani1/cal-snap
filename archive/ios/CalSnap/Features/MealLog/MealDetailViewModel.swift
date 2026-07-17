import Foundation
import SwiftData
import SwiftUI
import UIKit

@Observable
@MainActor
final class MealDetailViewModel {
    var meal: MealEntry?
    var loadError: String?
    var shareError: String?

    private let mealRepository: MealRepository
    private let healthKitService: HealthKitService

    init(mealRepository: MealRepository, healthKitService: HealthKitService) {
        self.mealRepository = mealRepository
        self.healthKitService = healthKitService
    }

    func load(mealId: UUID, context: ModelContext) {
        do {
            meal = try mealRepository.fetchMeal(id: mealId, context: context)
            loadError = meal == nil ? String(localized: "mealLog.detail.notFound.error") : nil
        } catch {
            meal = nil
            loadError = error.localizedDescription
        }
    }

    func deleteMeal(meal: MealEntry, context: ModelContext) throws {
        let shouldClearDisplayedMeal = self.meal?.id == meal.id
        try MealDeletionService.delete(
            meal: meal,
            mealRepository: mealRepository,
            healthKitService: healthKitService,
            context: context
        )
        if shouldClearDisplayedMeal {
            self.meal = nil
        }
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
