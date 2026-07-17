import SwiftData
import XCTest
@testable import CalSnap

@MainActor
final class MealLogCRUDTests: XCTestCase {
    private var dashboardViewModel: DashboardViewModel!
    private var scannerViewModel: MealScannerViewModel!
    private var mealRepository: MealRepository!
    private var healthKitService: HealthKitService!
    private var container: ModelContainer!
    private var context: ModelContext!
    private var userId: UUID!

    override func setUp() async throws {
        try await super.setUp()
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try ModelContainer(
            for: UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self,
            configurations: config
        )
        context = container.mainContext
        mealRepository = MealRepository()
        healthKitService = HealthKitService()
        userId = UUID()

        let profile = UserProfile(
            id: userId,
            name: "Alex",
            dailyCalorieTarget: 2000,
            tdee: 2350,
            deficitKcal: 350
        )
        context.insert(profile)

        dashboardViewModel = DashboardViewModel(
            userProfileRepository: UserProfileRepository(),
            mealRepository: mealRepository,
            weighInRepository: WeighInRepository()
        )
        scannerViewModel = MealScannerViewModel(
            userId: userId,
            mealAnalyzer: MockMealAnalyzer(),
            healthKitService: healthKitService,
            mealRepository: mealRepository
        )
    }

    func testMealDeletion() throws {
        let breakfast = MealEntry(
            userId: userId,
            timestamp: Date.now,
            mealType: .breakfast,
            totalCalories: 800,
            totalProteinG: 40,
            totalCarbsG: 60,
            totalFatG: 20,
            totalFiberG: 5
        )
        let lunch = MealEntry(
            userId: userId,
            timestamp: Date.now,
            mealType: .lunch,
            totalCalories: 700,
            totalProteinG: 35,
            totalCarbsG: 55,
            totalFatG: 18,
            totalFiberG: 4
        )
        context.insert(breakfast)
        context.insert(lunch)
        try context.save()

        dashboardViewModel.loadToday(context: context)
        XCTAssertEqual(dashboardViewModel.todaysCalories, 1500)
        XCTAssertEqual(dashboardViewModel.todaysFiberG, 9, accuracy: 0.01)

        let mealToDelete = try XCTUnwrap(try mealRepository.fetchMeal(id: breakfast.id, context: context))
        try MealDeletionService.delete(
            meal: mealToDelete,
            mealRepository: mealRepository,
            healthKitService: healthKitService,
            context: context
        )

        let remainingMeals = try context.fetch(FetchDescriptor<MealEntry>())
        XCTAssertEqual(remainingMeals.count, 1)

        dashboardViewModel.loadToday(context: context)
        XCTAssertEqual(dashboardViewModel.todaysCalories, 700)
        XCTAssertEqual(dashboardViewModel.todaysProteinG, 35, accuracy: 0.01)
        XCTAssertEqual(dashboardViewModel.todaysFiberG, 4, accuracy: 0.01)
    }

    func testMealEdit() async throws {
        let foodItem = FoodItem(
            name: "Chicken",
            estimatedWeightG: 100,
            calories: 400,
            proteinG: 30,
            carbsG: 10,
            fatG: 8,
            fiberG: 2,
            confidence: 0.9,
            isFlagged: false
        )
        let meal = MealEntry(
            userId: userId,
            timestamp: Date.now,
            mealType: .lunch,
            totalCalories: 400,
            totalProteinG: 30,
            totalCarbsG: 10,
            totalFatG: 8,
            totalFiberG: 2,
            geminiConfidence: 0.9,
            items: [foodItem]
        )
        context.insert(foodItem)
        context.insert(meal)
        try context.save()

        let originalId = meal.id
        let originalTimestamp = meal.timestamp

        dashboardViewModel.loadToday(context: context)
        XCTAssertEqual(dashboardViewModel.todaysCalories, 400)

        let persistedMeal = try XCTUnwrap(try mealRepository.fetchMeal(id: meal.id, context: context))
        scannerViewModel.loadForEditing(meal: persistedMeal)
        scannerViewModel.adjustItem(id: foodItem.id, newWeightG: 200)

        try await scannerViewModel.updateMeal(context: context)

        dashboardViewModel.loadToday(context: context)
        XCTAssertEqual(dashboardViewModel.todaysCalories, 800)
        XCTAssertEqual(dashboardViewModel.todaysProteinG, 60, accuracy: 0.01)

        let updatedMeal = try XCTUnwrap(try mealRepository.fetchMeal(id: meal.id, context: context))
        XCTAssertEqual(updatedMeal.id, originalId)
        XCTAssertEqual(updatedMeal.timestamp, originalTimestamp)
        XCTAssertEqual(updatedMeal.totalCalories, 800)
        XCTAssertEqual(updatedMeal.totalProteinG, 60, accuracy: 0.01)
        XCTAssertEqual(updatedMeal.items.count, 1)
        XCTAssertEqual(updatedMeal.items.first?.calories, 800)
    }

    func testMealRepositoryDeleteThrowsWhenNotFound() throws {
        XCTAssertThrowsError(try mealRepository.delete(id: UUID(), context: context)) { error in
            XCTAssertEqual(error as? MealRepositoryError, .mealNotFound)
        }
    }

    func testMealRepositoryUpdateThrowsWhenNotFound() throws {
        let entry = MealEntry(
            userId: userId,
            timestamp: Date.now,
            mealType: .lunch,
            totalCalories: 400,
            totalProteinG: 30,
            totalCarbsG: 10,
            totalFatG: 8,
            totalFiberG: 2
        )
        XCTAssertThrowsError(try mealRepository.update(entry, items: [], context: context)) { error in
            XCTAssertEqual(error as? MealRepositoryError, .mealNotFound)
        }
    }

    func testMealDetailViewModelClearsDisplayedMealAfterDelete() throws {
        let meal = MealEntry(
            userId: userId,
            timestamp: Date.now,
            mealType: .lunch,
            totalCalories: 500,
            totalProteinG: 30,
            totalCarbsG: 40,
            totalFatG: 15,
            totalFiberG: 3
        )
        context.insert(meal)
        try context.save()

        let detailViewModel = MealDetailViewModel(
            mealRepository: mealRepository,
            healthKitService: healthKitService
        )
        detailViewModel.load(mealId: meal.id, context: context)
        XCTAssertNotNil(detailViewModel.meal)

        let persistedMeal = try XCTUnwrap(try mealRepository.fetchMeal(id: meal.id, context: context))
        try detailViewModel.deleteMeal(meal: persistedMeal, context: context)

        XCTAssertNil(detailViewModel.meal)
    }

    func testRemoveRoutesForMealId() {
        let mealId = UUID()
        var path: [DashboardRoute] = [
            .mealDetail(mealId),
            .mealScanner(.edit(mealId)),
            .weightProgress,
        ]

        path.removeRoutes(forMealId: mealId)

        XCTAssertEqual(path, [.weightProgress])
    }
}
