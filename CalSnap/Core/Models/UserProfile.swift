import Foundation
import SwiftData

@Model
final class UserProfile {
    @Attribute(.unique) var id: UUID
    var name: String
    var sex: BiologicalSex
    var dateOfBirth: Date
    var heightCm: Double
    var startingWeightKg: Double
    var goalWeightKg: Double
    var goalTargetDate: Date
    var activityLevel: ActivityLevel
    var dailyCalorieTarget: Int
    var tdee: Int
    var deficitKcal: Int
    var macroTargetProteinPct: Double
    var macroTargetCarbsPct: Double
    var macroTargetFatPct: Double
    var createdAt: Date
    var updatedAt: Date
    @Relationship(deleteRule: .cascade) var meals: [MealEntry]
    @Relationship(deleteRule: .cascade) var weighIns: [WeighIn]

    init(
        id: UUID = UUID(),
        name: String = "",
        sex: BiologicalSex = .male,
        dateOfBirth: Date = Calendar.current.date(byAdding: .year, value: -35, to: Date()) ?? Date(),
        heightCm: Double = 175,
        startingWeightKg: Double = 80,
        goalWeightKg: Double = 72,
        goalTargetDate: Date = Calendar.current.date(byAdding: .month, value: 6, to: Date()) ?? Date(),
        activityLevel: ActivityLevel = .moderatelyActive,
        dailyCalorieTarget: Int = 0,
        tdee: Int = 0,
        deficitKcal: Int = 350,
        macroTargetProteinPct: Double = 0.28,
        macroTargetCarbsPct: Double = 0.47,
        macroTargetFatPct: Double = 0.25,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        meals: [MealEntry] = [],
        weighIns: [WeighIn] = []
    ) {
        self.id = id
        self.name = name
        self.sex = sex
        self.dateOfBirth = dateOfBirth
        self.heightCm = heightCm
        self.startingWeightKg = startingWeightKg
        self.goalWeightKg = goalWeightKg
        self.goalTargetDate = goalTargetDate
        self.activityLevel = activityLevel
        self.dailyCalorieTarget = dailyCalorieTarget
        self.tdee = tdee
        self.deficitKcal = deficitKcal
        self.macroTargetProteinPct = macroTargetProteinPct
        self.macroTargetCarbsPct = macroTargetCarbsPct
        self.macroTargetFatPct = macroTargetFatPct
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.meals = meals
        self.weighIns = weighIns
    }
}
