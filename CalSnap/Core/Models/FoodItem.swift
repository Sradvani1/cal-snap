import Foundation
import SwiftData

@Model
final class FoodItem {
    @Attribute(.unique) var id: UUID
    var name: String
    var estimatedWeightG: Double
    var calories: Int
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var fiberG: Double
    var confidence: Double
    var usdaFoodId: String?
    var isFlagged: Bool

    init(
        id: UUID = UUID(),
        name: String = "",
        estimatedWeightG: Double = 0,
        calories: Int = 0,
        proteinG: Double = 0,
        carbsG: Double = 0,
        fatG: Double = 0,
        fiberG: Double = 0,
        confidence: Double = 0,
        usdaFoodId: String? = nil,
        isFlagged: Bool = false
    ) {
        self.id = id
        self.name = name
        self.estimatedWeightG = estimatedWeightG
        self.calories = calories
        self.proteinG = proteinG
        self.carbsG = carbsG
        self.fatG = fatG
        self.fiberG = fiberG
        self.confidence = confidence
        self.usdaFoodId = usdaFoodId
        self.isFlagged = isFlagged
    }
}
