import XCTest
@testable import CalSnap

final class WidgetSyncServiceTests: XCTestCase {
    func testMakeWidgetDataMapsDashboardTotalsAndMacroTargets() {
        let profile = UserProfile(
            name: "Alex",
            dailyCalorieTarget: 2000,
            tdee: 2350,
            deficitKcal: 350,
            macroTargetProteinPct: 0.28,
            macroTargetCarbsPct: 0.47,
            macroTargetFatPct: 0.25
        )
        let referenceDate = Date(timeIntervalSince1970: 1_700_000_000)

        let data = WidgetSyncService.makeWidgetData(
            profile: profile,
            consumedCalories: 1500,
            proteinConsumedG: 90,
            carbsConsumedG: 180,
            fatConsumedG: 50,
            updatedAt: referenceDate
        )

        XCTAssertEqual(data.displayName, "Alex")
        XCTAssertEqual(data.targetCalories, 2000)
        XCTAssertEqual(data.consumedCalories, 1500)
        XCTAssertEqual(data.proteinConsumedG, 90)
        XCTAssertEqual(data.carbsConsumedG, 180)
        XCTAssertEqual(data.fatConsumedG, 50)
        XCTAssertEqual(data.updatedAt, referenceDate)

        let macros = NutritionCalculator.macroTargets(
            dailyCalories: 2000,
            proteinPct: 0.28,
            carbsPct: 0.47,
            fatPct: 0.25
        )
        XCTAssertEqual(data.proteinTargetG, macros.proteinG)
        XCTAssertEqual(data.carbsTargetG, macros.carbsG)
        XCTAssertEqual(data.fatTargetG, macros.fatG)
    }
}
