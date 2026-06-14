import Foundation
import SwiftData

@Model
final class MealEntry {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var timestamp: Date
    var mealType: MealType
    @Attribute(.externalStorage) var photoData: Data?
    var textDescription: String?
    var totalCalories: Int
    var totalProteinG: Double
    var totalCarbsG: Double
    var totalFatG: Double
    var totalFiberG: Double
    var geminiConfidence: Double
    var isManuallyAdjusted: Bool
    var estimationNotes: String?
    @Relationship(deleteRule: .cascade) var items: [FoodItem]

    init(
        id: UUID = UUID(),
        userId: UUID,
        timestamp: Date = Date(),
        mealType: MealType = .suggested(for: Date()),
        photoData: Data? = nil,
        textDescription: String? = nil,
        totalCalories: Int = 0,
        totalProteinG: Double = 0,
        totalCarbsG: Double = 0,
        totalFatG: Double = 0,
        totalFiberG: Double = 0,
        geminiConfidence: Double = 0,
        isManuallyAdjusted: Bool = false,
        estimationNotes: String? = nil,
        items: [FoodItem] = []
    ) {
        self.id = id
        self.userId = userId
        self.timestamp = timestamp
        self.mealType = mealType
        self.photoData = photoData
        self.textDescription = textDescription
        self.totalCalories = totalCalories
        self.totalProteinG = totalProteinG
        self.totalCarbsG = totalCarbsG
        self.totalFatG = totalFatG
        self.totalFiberG = totalFiberG
        self.geminiConfidence = geminiConfidence
        self.isManuallyAdjusted = isManuallyAdjusted
        self.estimationNotes = estimationNotes
        self.items = items
    }
}
