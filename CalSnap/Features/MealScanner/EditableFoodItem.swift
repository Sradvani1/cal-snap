import Foundation

struct EditableFoodItem: Identifiable, Equatable {
    let id: UUID
    var name: String
    var weightG: Double
    var calories: Int
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var fiberG: Double
    var confidence: Double
    var isFlagged: Bool
    var originalWeightG: Double?

    init(
        id: UUID = UUID(),
        name: String,
        weightG: Double,
        calories: Int,
        proteinG: Double,
        carbsG: Double,
        fatG: Double,
        fiberG: Double,
        confidence: Double,
        isFlagged: Bool,
        originalWeightG: Double? = nil
    ) {
        self.id = id
        self.name = name
        self.weightG = weightG
        self.calories = calories
        self.proteinG = proteinG
        self.carbsG = carbsG
        self.fatG = fatG
        self.fiberG = fiberG
        self.confidence = confidence
        self.isFlagged = isFlagged
        self.originalWeightG = originalWeightG ?? weightG
    }

    mutating func updateWeight(to newWeightG: Double) {
        guard weightG > 0 else { return }
        let ratio = newWeightG / weightG
        calories = Int((Double(calories) * ratio).rounded())
        proteinG *= ratio
        carbsG *= ratio
        fatG *= ratio
        fiberG *= ratio
        weightG = newWeightG
    }

    static func from(
        result: MealAnalysisResponse.FoodItemResult,
        flaggedNames: Set<String>
    ) -> EditableFoodItem {
        let isFlagged = result.confidence < AppConstants.Gemini.confidenceThreshold
            || flaggedNames.contains(result.name)
        return EditableFoodItem(
            name: result.name,
            weightG: result.estimatedWeightG,
            calories: result.calories,
            proteinG: result.proteinG,
            carbsG: result.carbsG,
            fatG: result.fatG,
            fiberG: result.fiberG,
            confidence: result.confidence,
            isFlagged: isFlagged,
            originalWeightG: result.estimatedWeightG
        )
    }

    static func emptyManual() -> EditableFoodItem {
        EditableFoodItem(
            name: "",
            weightG: 100,
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            fiberG: 0,
            confidence: 1.0,
            isFlagged: false,
            originalWeightG: 100
        )
    }

    func toFoodItem() -> FoodItem {
        FoodItem(
            id: id,
            name: name,
            estimatedWeightG: weightG,
            calories: calories,
            proteinG: proteinG,
            carbsG: carbsG,
            fatG: fatG,
            fiberG: fiberG,
            confidence: confidence,
            usdaFoodId: nil,
            isFlagged: isFlagged
        )
    }
}
