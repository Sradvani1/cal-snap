import SwiftData
import XCTest
@testable import CalSnap

@MainActor
final class DashboardViewModelTests: XCTestCase {
    private var viewModel: DashboardViewModel!
    private var container: ModelContainer!
    private var context: ModelContext!

    override func setUp() async throws {
        try await super.setUp()
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try ModelContainer(
            for: UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self,
            configurations: config
        )
        context = container.mainContext
        viewModel = DashboardViewModel(
            userProfileRepository: UserProfileRepository(),
            mealRepository: MealRepository(),
            weighInRepository: WeighInRepository()
        )
    }

    func testDashboardCalcToday() throws {
        let profile = UserProfile(
            name: "Alex",
            dailyCalorieTarget: 2000,
            tdee: 2350,
            deficitKcal: 350
        )
        context.insert(profile)

        let meals = [
            MealEntry(
                userId: profile.id,
                timestamp: Date(),
                mealType: .breakfast,
                totalCalories: 400,
                totalProteinG: 30,
                totalCarbsG: 40,
                totalFatG: 12,
                totalFiberG: 5
            ),
            MealEntry(
                userId: profile.id,
                timestamp: Date(),
                mealType: .lunch,
                totalCalories: 600,
                totalProteinG: 35,
                totalCarbsG: 55,
                totalFatG: 20,
                totalFiberG: 8
            ),
            MealEntry(
                userId: profile.id,
                timestamp: Date(),
                mealType: .dinner,
                totalCalories: 500,
                totalProteinG: 40,
                totalCarbsG: 45,
                totalFatG: 18,
                totalFiberG: 6
            ),
        ]
        meals.forEach { context.insert($0) }
        try context.save()

        viewModel.loadToday(context: context, activeUserId: profile.id.uuidString)

        XCTAssertEqual(viewModel.todaysCalories, 1500)
        XCTAssertEqual(viewModel.todaysProteinG, 105, accuracy: 0.01)
        XCTAssertEqual(viewModel.todaysCarbsG, 140, accuracy: 0.01)
        XCTAssertEqual(viewModel.todaysFatG, 50, accuracy: 0.01)
        XCTAssertEqual(viewModel.todaysFiberG, 19, accuracy: 0.01)
    }

    func testProgressColor() {
        XCTAssertEqual(DashboardViewModel.progressBand(for: 0.89), .under)
        XCTAssertEqual(DashboardViewModel.progressBand(for: 0.95), .onTrack)
        XCTAssertEqual(DashboardViewModel.progressBand(for: 1.15), .over)
    }

    func testRemaining() {
        viewModel.activeProfile = UserProfile(dailyCalorieTarget: 2000)
        viewModel.todaysCalories = 2300
        XCTAssertEqual(viewModel.remainingCalories, -300)
    }
}
