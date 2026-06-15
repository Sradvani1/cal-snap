import SwiftData
import XCTest
@testable import CalSnap

final class AnalyticsTests: XCTestCase {
    func testAdherenceCalculation() {
        let loggedDays = [
            DailyNutritionSummary(date: Date.now, calories: 1750, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
            DailyNutritionSummary(date: Date.now, calories: 1900, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
            DailyNutritionSummary(date: Date.now, calories: 2100, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
            DailyNutritionSummary(date: Date.now, calories: 2200, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
            DailyNutritionSummary(date: Date.now, calories: 2000, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
            DailyNutritionSummary(date: Date.now, calories: 1700, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
            DailyNutritionSummary(date: Date.now, calories: 2050, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
        ]

        let result = AnalyticsAggregator.adherencePercent(loggedDays: loggedDays, calorieTarget: 2000)
        XCTAssertEqual(result, (4.0 / 7.0) * 100, accuracy: 0.1)

        let partialDays = Array(loggedDays.prefix(5))
        let partialResult = AnalyticsAggregator.adherencePercent(loggedDays: partialDays, calorieTarget: 2000)
        XCTAssertEqual(partialResult, (3.0 / 5.0) * 100, accuracy: 0.1)
    }

    func testDayOfWeekBreakdown() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .gmt

        guard let monday = calendar.date(from: DateComponents(year: 2026, month: 6, day: 8)),
              let wednesday = calendar.date(from: DateComponents(year: 2026, month: 6, day: 10)) else {
            XCTFail("Failed to build test dates")
            return
        }

        let profileId = UUID()
        let meals = [
            MealEntry(userId: profileId, timestamp: monday, mealType: .lunch, totalCalories: 500),
            MealEntry(userId: profileId, timestamp: monday.addingTimeInterval(3600), mealType: .dinner, totalCalories: 600),
            MealEntry(userId: profileId, timestamp: wednesday, mealType: .lunch, totalCalories: 800),
        ]

        let breakdown = AnalyticsAggregator.dayOfWeekBreakdown(meals: meals, calendar: calendar)
        XCTAssertEqual(breakdown[.monday], 1100)
        XCTAssertEqual(breakdown[.wednesday], 800)
        XCTAssertEqual(breakdown[.tuesday, default: 0], 0)
    }

    func testTopFoodsAggregation() {
        let profileId = UUID()
        let chicken = FoodItem(name: "Chicken", calories: 200)
        let rice = FoodItem(name: "Rice", calories: 150)
        let broccoli = FoodItem(name: "Broccoli", calories: 50)
        let salmon = FoodItem(name: "Salmon", calories: 220)
        let eggs = FoodItem(name: "Eggs", calories: 140)
        let yogurt = FoodItem(name: "Yogurt", calories: 120)

        let meals = [
            MealEntry(userId: profileId, items: [chicken, chicken, chicken, chicken]),
            MealEntry(userId: profileId, items: [rice, rice]),
            MealEntry(userId: profileId, items: [broccoli, salmon, eggs, yogurt]),
        ]

        let topFoods = AnalyticsAggregator.topFoods(meals: meals, limit: 5)
        XCTAssertEqual(topFoods.count, 5)
        XCTAssertEqual(topFoods.first?.name, "Chicken")
        XCTAssertEqual(topFoods.first?.count, 4)
        XCTAssertEqual(topFoods.first?.avgCalories, 200)
        XCTAssertTrue(topFoods[0].count >= topFoods[1].count)
    }
}
