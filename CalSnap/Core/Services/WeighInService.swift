import Foundation
import OSLog
import SwiftData

private let weighInLogger = Logger(subsystem: "com.calsnap", category: "WeighInService")

enum WeighInService {
    struct RecalculationResult {
        let tdee: Int
        let dailyTarget: Int
        let deficitKcal: Int
        let bmi: Double
    }

    struct SaveResult {
        let weighIn: WeighIn
        let didTriggerPlateau: Bool
    }

    static func recalculate(profile: UserProfile, newWeightKg: Double) -> RecalculationResult {
        let age = NutritionCalculator.age(from: profile.dateOfBirth)
        let bmr = NutritionCalculator.bmr(
            weightKg: newWeightKg,
            heightCm: profile.heightCm,
            ageYears: age,
            sex: profile.sex
        )
        let tdeeValue = NutritionCalculator.tdee(bmr: bmr, activityLevel: profile.activityLevel)
        let targetResult = NutritionCalculator.dailyTarget(
            tdee: tdeeValue,
            requestedDeficit: profile.deficitKcal,
            sex: profile.sex
        )
        let bmi = NutritionCalculator.bmi(weightKg: newWeightKg, heightCm: profile.heightCm)

        return RecalculationResult(
            tdee: Int(tdeeValue.rounded()),
            dailyTarget: targetResult.target,
            deficitKcal: targetResult.deficit,
            bmi: bmi
        )
    }

    static func save(
        profile: UserProfile,
        newWeightKg: Double,
        date: Date,
        weighInRepository: WeighInRepository,
        healthKitService: HealthKitService,
        context: ModelContext
    ) throws -> SaveResult {
        let recalculation = recalculate(profile: profile, newWeightKg: newWeightKg)

        profile.tdee = recalculation.tdee
        profile.dailyCalorieTarget = recalculation.dailyTarget
        profile.deficitKcal = recalculation.deficitKcal
        profile.updatedAt = Date.now

        let weighIn = WeighIn(
            userId: profile.id,
            date: date,
            weightKg: newWeightKg,
            calculatedTDEE: recalculation.tdee,
            adjustedDailyTarget: recalculation.dailyTarget,
            bmi: recalculation.bmi
        )

        try weighInRepository.save(weighIn, context: context)

        let healthKit = healthKitService
        Task {
            do {
                try await healthKit.logBodyMass(kg: newWeightKg, at: date)
            } catch {
                weighInLogger.error("HealthKit body mass log failed: \(error.localizedDescription)")
            }
        }

        let plateauWeighIns = try weighInRepository.fetchWeeklyPlateauWeighIns(
            for: profile.id,
            count: AppConstants.Plateau.weeksToDetect,
            context: context
        )
        let didTriggerPlateau = NutritionCalculator.isOnPlateau(weighIns: plateauWeighIns)

        return SaveResult(weighIn: weighIn, didTriggerPlateau: didTriggerPlateau)
    }
}
