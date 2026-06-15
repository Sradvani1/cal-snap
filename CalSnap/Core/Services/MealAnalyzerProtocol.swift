import Foundation

protocol MealAnalyzerProtocol: Sendable {
    func analyzeMeal(_ request: MealAnalysisRequest) async throws -> MealAnalysisResponse
}

extension GeminiService: MealAnalyzerProtocol {}

final class MockMealAnalyzer: MealAnalyzerProtocol, @unchecked Sendable {
    var mockResponse: MealAnalysisResponse?
    var shouldThrow = false
    private(set) var lastRequest: MealAnalysisRequest?

    func analyzeMeal(_ request: MealAnalysisRequest) async throws -> MealAnalysisResponse {
        lastRequest = request
        if shouldThrow {
            throw GeminiError.emptyResponse
        }
        return mockResponse ?? .testDefault
    }
}

extension MealAnalysisResponse {
    static var testDefault: MealAnalysisResponse {
        MealAnalysisResponse(
            items: [
                FoodItemResult(
                    name: "Grilled Chicken Breast",
                    estimatedWeightG: 150,
                    calories: 248,
                    proteinG: 46,
                    carbsG: 0,
                    fatG: 5,
                    fiberG: 0,
                    confidence: 0.9
                ),
                FoodItemResult(
                    name: "Brown Rice",
                    estimatedWeightG: 120,
                    calories: 134,
                    proteinG: 3,
                    carbsG: 28,
                    fatG: 1,
                    fiberG: 2,
                    confidence: 0.55
                ),
            ],
            mealTotal: MealTotal(
                calories: 382,
                proteinG: 49,
                carbsG: 28,
                fatG: 6,
                fiberG: 2
            ),
            flaggedItems: ["Brown Rice"],
            estimationNotes: "Portion sizes estimated from plate context."
        )
    }
}
