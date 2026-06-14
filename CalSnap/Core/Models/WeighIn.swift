import Foundation
import SwiftData

@Model
final class WeighIn {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var date: Date
    var weightKg: Double
    var calculatedTDEE: Int
    var adjustedDailyTarget: Int
    var bmi: Double
    var sourceIsHealthKit: Bool

    init(
        id: UUID = UUID(),
        userId: UUID,
        date: Date = Date(),
        weightKg: Double,
        calculatedTDEE: Int = 0,
        adjustedDailyTarget: Int = 0,
        bmi: Double = 0,
        sourceIsHealthKit: Bool = false
    ) {
        self.id = id
        self.userId = userId
        self.date = date
        self.weightKg = weightKg
        self.calculatedTDEE = calculatedTDEE
        self.adjustedDailyTarget = adjustedDailyTarget
        self.bmi = bmi
        self.sourceIsHealthKit = sourceIsHealthKit
    }
}
