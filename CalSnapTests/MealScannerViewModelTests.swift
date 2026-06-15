import SwiftData
import UIKit
import XCTest
@testable import CalSnap

@MainActor
final class MealScannerViewModelTests: XCTestCase {
    private var viewModel: MealScannerViewModel!
    private var mockAnalyzer: MockMealAnalyzer!
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
        mockAnalyzer = MockMealAnalyzer()
        viewModel = MealScannerViewModel(
            userId: userId,
            mealAnalyzer: mockAnalyzer,
            healthKitService: HealthKitService(),
            mealRepository: MealRepository()
        )
    }

    private func testImage() -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 10, height: 10)).image { context in
            UIColor.red.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 10, height: 10))
        }
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

    func testApplyAnalysisPopulatesResults() {
        viewModel.applyAnalysis(.testDefault)

        XCTAssertEqual(viewModel.phase, .results)
        XCTAssertEqual(viewModel.editableItems.count, 2)
        XCTAssertEqual(viewModel.estimationNotes, MealAnalysisResponse.testDefault.estimationNotes)
        XCTAssertFalse(viewModel.isManualEntry)
    }

    func testAnalyzeMissingAPIKey() {
        viewModel.selectedImage = testImage()

        viewModel.analyze()

        XCTAssertEqual(viewModel.phase, .error)
        XCTAssertEqual(viewModel.scannerError, .missingAPIKey)
    }

    func testApplyAnalysisEmptyItemsShowsUnrecognizable() {
        let emptyResponse = MealAnalysisResponse(
            items: [],
            mealTotal: MealAnalysisResponse.MealTotal(
                calories: 0,
                proteinG: 0,
                carbsG: 0,
                fatG: 0,
                fiberG: 0
            ),
            flaggedItems: [],
            estimationNotes: ""
        )

        viewModel.applyAnalysis(emptyResponse)

        XCTAssertEqual(viewModel.phase, .error)
        XCTAssertEqual(viewModel.scannerError, .unrecognizable)
        XCTAssertTrue(viewModel.editableItems.isEmpty)
    }

    func testManualEntryConfidenceSemantics() {
        viewModel.enterManualEntry()
        viewModel.editableItems[0].name = "Oatmeal"
        viewModel.editableItems[0].calories = 300
        viewModel.finishManualEntry()

        XCTAssertTrue(viewModel.isManualEntry)
        XCTAssertEqual(viewModel.overallConfidence, 0)

        let entry = viewModel.makeMealEntry()
        XCTAssertEqual(entry.geminiConfidence, 0)
        XCTAssertTrue(entry.isManuallyAdjusted)
        XCTAssertNil(entry.estimationNotes)
    }

    func testHasAdjustedItemsSetsManuallyAdjusted() {
        viewModel.applyAnalysis(.testDefault)
        guard let itemId = viewModel.editableItems.first?.id else {
            XCTFail("Expected at least one editable item")
            return
        }

        viewModel.adjustItem(id: itemId, newWeightG: 300)

        let entry = viewModel.makeMealEntry()
        XCTAssertTrue(entry.isManuallyAdjusted)
    }

    func testHasUnsavedWorkCaptureWithImage() {
        XCTAssertFalse(viewModel.hasUnsavedWork)

        viewModel.selectedImage = testImage()

        XCTAssertTrue(viewModel.hasUnsavedWork)
    }

    func testHasUnsavedWorkFalseAfterEditLoadWithoutChanges() throws {
        let foodItem = FoodItem(
            name: "Chicken",
            estimatedWeightG: 150,
            calories: 248,
            proteinG: 46,
            carbsG: 0,
            fatG: 5,
            fiberG: 0,
            confidence: 0.9,
            isFlagged: false
        )
        let meal = MealEntry(
            userId: userId,
            timestamp: Date.now,
            mealType: .lunch,
            totalCalories: 248,
            totalProteinG: 46,
            totalCarbsG: 0,
            totalFatG: 5,
            totalFiberG: 0,
            geminiConfidence: 0.9,
            items: [foodItem]
        )
        context.insert(foodItem)
        context.insert(meal)
        try context.save()

        viewModel.loadForEditing(meal: meal)

        XCTAssertFalse(viewModel.hasUnsavedWork)
    }

    func testHasUnsavedWorkTrueAfterEditWeightChange() throws {
        let foodItem = FoodItem(
            name: "Chicken",
            estimatedWeightG: 150,
            calories: 248,
            proteinG: 46,
            carbsG: 0,
            fatG: 5,
            fiberG: 0,
            confidence: 0.9,
            isFlagged: false
        )
        let meal = MealEntry(
            userId: userId,
            timestamp: Date.now,
            mealType: .lunch,
            totalCalories: 248,
            totalProteinG: 46,
            totalCarbsG: 0,
            totalFatG: 5,
            totalFiberG: 0,
            geminiConfidence: 0.9,
            items: [foodItem]
        )
        context.insert(foodItem)
        context.insert(meal)
        try context.save()

        viewModel.loadForEditing(meal: meal)
        viewModel.adjustItem(id: foodItem.id, newWeightG: 200)

        XCTAssertTrue(viewModel.hasUnsavedWork)
    }
}
