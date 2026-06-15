import SwiftData
import XCTest
@testable import CalSnap

@MainActor
final class MealScannerViewModelTests: XCTestCase {
    private var viewModel: MealScannerViewModel!
    private var userId: UUID!
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
        userId = UUID()
        viewModel = MealScannerViewModel(
            userId: userId,
            mealAnalyzer: MockMealAnalyzer(),
            healthKitService: HealthKitService(),
            mealRepository: MealRepository()
        )
    }

    func testEditableFoodItemScaling() {
        var item = EditableFoodItem(
            name: "Chicken",
            weightG: 100,
            calories: 200,
            proteinG: 20,
            carbsG: 30,
            fatG: 10,
            fiberG: 5,
            confidence: 0.9,
            isFlagged: false
        )

        item.updateWeight(to: 200)

        XCTAssertEqual(item.weightG, 200)
        XCTAssertEqual(item.calories, 400)
        XCTAssertEqual(item.proteinG, 40, accuracy: 0.01)
        XCTAssertEqual(item.carbsG, 60, accuracy: 0.01)
        XCTAssertEqual(item.fatG, 20, accuracy: 0.01)
        XCTAssertEqual(item.fiberG, 10, accuracy: 0.01)
    }

    func testOverallConfidence() {
        let items = [
            EditableFoodItem(
                name: "A",
                weightG: 100,
                calories: 100,
                proteinG: 10,
                carbsG: 10,
                fatG: 5,
                fiberG: 1,
                confidence: 0.9,
                isFlagged: false
            ),
            EditableFoodItem(
                name: "B",
                weightG: 100,
                calories: 100,
                proteinG: 10,
                carbsG: 10,
                fatG: 5,
                fiberG: 1,
                confidence: 0.7,
                isFlagged: false
            ),
        ]

        XCTAssertEqual(MealScannerViewModel.computeOverallConfidence(items: items), 0.8, accuracy: 0.01)
    }

    func testMealEntryCreation() throws {
        let response = MealAnalysisResponse.testDefault
        let flaggedNames = Set(response.flaggedItems)
        viewModel.editableItems = response.items.map {
            EditableFoodItem.from(result: $0, flaggedNames: flaggedNames)
        }
        viewModel.estimationNotes = response.estimationNotes
        viewModel.mealType = .lunch
        viewModel.isManualEntry = false

        let entry = viewModel.makeMealEntry()

        XCTAssertEqual(entry.userId, userId)
        XCTAssertEqual(entry.mealType, .lunch)
        XCTAssertEqual(entry.totalCalories, 382)
        XCTAssertEqual(entry.totalProteinG, 49, accuracy: 0.01)
        XCTAssertEqual(entry.totalCarbsG, 28, accuracy: 0.01)
        XCTAssertEqual(entry.totalFatG, 6, accuracy: 0.01)
        XCTAssertEqual(entry.totalFiberG, 2, accuracy: 0.01)
        XCTAssertEqual(entry.items.count, 2)
        XCTAssertEqual(entry.geminiConfidence, 0.725, accuracy: 0.01)
        XCTAssertFalse(entry.isManuallyAdjusted)
        XCTAssertEqual(entry.estimationNotes, response.estimationNotes)
        XCTAssertEqual(entry.items.first?.name, "Grilled Chicken Breast")

        try MealRepository().save(entry, context: context)

        let foodDescriptor = FetchDescriptor<FoodItem>()
        let savedFoodItems = try context.fetch(foodDescriptor)
        XCTAssertEqual(savedFoodItems.count, 2)

        let mealDescriptor = FetchDescriptor<MealEntry>()
        let savedMeals = try context.fetch(mealDescriptor)
        XCTAssertEqual(savedMeals.count, 1)
        XCTAssertEqual(savedMeals.first?.items.count, 2)
    }
}
