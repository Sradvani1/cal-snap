import Foundation
import SwiftData

@Observable
@MainActor
final class WeightProgressViewModel {
    var weighIns: [WeighIn] = []
    var loadError: String?

    let profile: UserProfile
    let useLbs: Bool

    private let weighInRepository: WeighInRepository

    init(
        profile: UserProfile,
        useLbs: Bool,
        weighInRepository: WeighInRepository
    ) {
        self.profile = profile
        self.useLbs = useLbs
        self.weighInRepository = weighInRepository
    }

    var currentWeightKg: Double {
        weighIns.max(by: { $0.date < $1.date })?.weightKg ?? profile.startingWeightKg
    }

    var lostSoFarKg: Double {
        max(0, profile.startingWeightKg - currentWeightKg)
    }

    var toGoalKg: Double {
        max(0, currentWeightKg - profile.goalWeightKg)
    }

    var progressFraction: Double {
        let total = profile.startingWeightKg - profile.goalWeightKg
        guard total > 0 else { return 0 }
        let progress = profile.startingWeightKg - currentWeightKg
        return min(max(progress / total, 0), 1)
    }

    var weeklyRateKg: Double? {
        let sorted = weighIns.sorted { $0.date < $1.date }
        return NutritionCalculator.weeklyLossRateKg(from: sorted)
    }

    var projectedGoalDate: Date? {
        let age = NutritionCalculator.age(from: profile.dateOfBirth)
        return NutritionCalculator.projectedGoalDate(
            currentWeightKg: currentWeightKg,
            goalWeightKg: profile.goalWeightKg,
            heightCm: profile.heightCm,
            ageYears: age,
            sex: profile.sex,
            activityLevel: profile.activityLevel,
            dailyDeficitKcal: profile.deficitKcal
        )
    }

    var projectionPoints: [(date: Date, weightKg: Double)] {
        let age = NutritionCalculator.age(from: profile.dateOfBirth)
        let startDate = weighIns.max(by: { $0.date < $1.date })?.date ?? Date()
        return NutritionCalculator.projectionPoints(
            startWeightKg: currentWeightKg,
            goalWeightKg: profile.goalWeightKg,
            heightCm: profile.heightCm,
            ageYears: age,
            sex: profile.sex,
            activityLevel: profile.activityLevel,
            dailyDeficitKcal: profile.deficitKcal,
            startDate: startDate
        )
    }

    func load(context: ModelContext) {
        loadError = nil
        do {
            weighIns = try weighInRepository.fetchAll(
                for: profile.id,
                sortDescending: true,
                context: context
            )
        } catch {
            loadError = error.localizedDescription
            weighIns = []
        }
    }

    func formatWeight(_ kg: Double) -> String {
        UnitFormatters.formatWeight(kg: kg, useLbs: useLbs)
    }

    func formatWeeklyRate() -> String {
        guard let rateKg = weeklyRateKg else {
            return "Need more weigh-ins"
        }
        if useLbs {
            let lbsPerWeek = UnitFormatters.kgToLbs(rateKg)
            return String(format: "~%.1f lbs/week", lbsPerWeek)
        }
        return String(format: "~%.1f kg/week", rateKg)
    }

    func formatProjectedGoalDate() -> String {
        guard let date = projectedGoalDate else {
            return profile.deficitKcal == 0 ? "Maintaining" : "—"
        }
        return date.formatted(date: .abbreviated, time: .omitted)
    }
}
