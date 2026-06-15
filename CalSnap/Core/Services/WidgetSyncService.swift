import Foundation
import SwiftData
import WidgetKit

enum WidgetSyncService {
    @MainActor
    static func sync(
        profile: UserProfile,
        consumedCalories: Int,
        proteinConsumedG: Double,
        carbsConsumedG: Double,
        fatConsumedG: Double
    ) {
        let macros = NutritionCalculator.macroTargets(
            dailyCalories: profile.dailyCalorieTarget,
            proteinPct: profile.macroTargetProteinPct,
            carbsPct: profile.macroTargetCarbsPct,
            fatPct: profile.macroTargetFatPct
        )

        let data = WidgetData(
            displayName: profile.name,
            targetCalories: profile.dailyCalorieTarget,
            consumedCalories: consumedCalories,
            proteinConsumedG: proteinConsumedG,
            carbsConsumedG: carbsConsumedG,
            fatConsumedG: fatConsumedG,
            proteinTargetG: macros.proteinG,
            carbsTargetG: macros.carbsG,
            fatTargetG: macros.fatG,
            updatedAt: Date.now
        )
        WidgetDataStore.save(data)
        WidgetCenter.shared.reloadAllTimelines()
    }

    @MainActor
    static func sync(profile: UserProfile, dashboard: DashboardViewModel) {
        sync(
            profile: profile,
            consumedCalories: dashboard.todaysCalories,
            proteinConsumedG: dashboard.todaysProteinG,
            carbsConsumedG: dashboard.todaysCarbsG,
            fatConsumedG: dashboard.todaysFatG
        )
    }

    @MainActor
    static func syncFromProfile(
        profile: UserProfile,
        mealRepository: MealRepository,
        context: ModelContext
    ) {
        do {
            let meals = try mealRepository.fetchMeals(for: profile.id, on: Date.now, context: context)
            var calories = 0
            var protein = 0.0
            var carbs = 0.0
            var fat = 0.0
            for meal in meals {
                calories += meal.totalCalories
                protein += meal.totalProteinG
                carbs += meal.totalCarbsG
                fat += meal.totalFatG
            }
            sync(
                profile: profile,
                consumedCalories: calories,
                proteinConsumedG: protein,
                carbsConsumedG: carbs,
                fatConsumedG: fat
            )
        } catch {
            sync(
                profile: profile,
                consumedCalories: 0,
                proteinConsumedG: 0,
                carbsConsumedG: 0,
                fatConsumedG: 0
            )
        }
    }

    @MainActor
    static func clear() {
        WidgetDataStore.clear()
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Builds widget payload without writing to the App Group — used by unit tests.
    static func makeWidgetData(
        profile: UserProfile,
        consumedCalories: Int,
        proteinConsumedG: Double,
        carbsConsumedG: Double,
        fatConsumedG: Double,
        updatedAt: Date = .now
    ) -> WidgetData {
        let macros = NutritionCalculator.macroTargets(
            dailyCalories: profile.dailyCalorieTarget,
            proteinPct: profile.macroTargetProteinPct,
            carbsPct: profile.macroTargetCarbsPct,
            fatPct: profile.macroTargetFatPct
        )
        return WidgetData(
            displayName: profile.name,
            targetCalories: profile.dailyCalorieTarget,
            consumedCalories: consumedCalories,
            proteinConsumedG: proteinConsumedG,
            carbsConsumedG: carbsConsumedG,
            fatConsumedG: fatConsumedG,
            proteinTargetG: macros.proteinG,
            carbsTargetG: macros.carbsG,
            fatTargetG: macros.fatG,
            updatedAt: updatedAt
        )
    }
}
