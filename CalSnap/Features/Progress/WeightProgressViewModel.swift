import Foundation
import SwiftData

struct WeightProjectionPoint: Identifiable {
    let date: Date
    let weightKg: Double

    var id: Date { date }
}

@MainActor
@Observable
final class WeightProgressViewModel {
    var weighIns: [WeighIn] = []
    var loadError: String?

    private(set) var chartWeighInsAscending: [WeighIn] = []
    private(set) var weeklyRateKg: Double?
    private(set) var projectedGoalDate: Date?
    private(set) var projectionPoints: [WeightProjectionPoint] = []

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

    var progressAccessibilityValue: String {
        let percent = Int((progressFraction * 100).rounded())
        return String(format: String(localized: "progress.percentToGoal.accessibility"), percent)
    }

    var chartAccessibilitySummary: String {
        guard !weighIns.isEmpty else {
            return String(localized: "progress.noWeighIns.accessibility")
        }

        let current = formatWeight(currentWeightKg)
        let goal = formatWeight(profile.goalWeightKg)
        let change = currentWeightKg - profile.startingWeightKg
        let direction = if change < -0.1 {
            String(format: String(localized: "progress.trendDown.accessibility"), formatWeight(abs(change)))
        } else if change > 0.1 {
            String(format: String(localized: "progress.trendUp.accessibility"), formatWeight(change))
        } else {
            String(localized: "progress.trendUnchanged.accessibility")
        }
        return String(format: String(localized: "progress.chartSummary.accessibility"), current, direction, goal)
    }

    func load(context: ModelContext) {
        loadError = nil
        do {
            weighIns = try weighInRepository.fetchAll(
                for: profile.id,
                sortDescending: true,
                context: context
            )
            refreshDerivedData()
        } catch {
            loadError = error.localizedDescription
            weighIns = []
            clearDerivedData()
        }
    }

    func formatWeight(_ kg: Double) -> String {
        UnitFormatters.formatWeight(kg: kg, useLbs: useLbs)
    }

    func formatWeeklyRate() -> String {
        guard let rateKg = weeklyRateKg else {
            return String(localized: "progress.stats.needMoreWeighIns")
        }
        if useLbs {
            let lbsPerWeek = UnitFormatters.kgToLbs(rateKg)
            return String(format: String(localized: "progress.stats.rateLbsPerWeek"), lbsPerWeek)
        }
        return String(format: String(localized: "progress.stats.rateKgPerWeek"), rateKg)
    }

    func formatProjectedGoalDate() -> String {
        guard let date = projectedGoalDate else {
            return profile.deficitKcal == 0
                ? String(localized: "progress.stats.maintaining")
                : String(localized: "common.placeholder.emDash")
        }
        return date.formatted(date: .abbreviated, time: .omitted)
    }

    private func refreshDerivedData() {
        chartWeighInsAscending = weighIns.reversed()
        let sorted = chartWeighInsAscending
        weeklyRateKg = NutritionCalculator.weeklyLossRateKg(from: sorted)

        let age = NutritionCalculator.age(from: profile.dateOfBirth)
        projectedGoalDate = NutritionCalculator.projectedGoalDate(
            currentWeightKg: currentWeightKg,
            goalWeightKg: profile.goalWeightKg,
            heightCm: profile.heightCm,
            ageYears: age,
            sex: profile.sex,
            activityLevel: profile.activityLevel,
            dailyDeficitKcal: profile.deficitKcal
        )

        let startDate = weighIns.max(by: { $0.date < $1.date })?.date ?? Date.now
        projectionPoints = NutritionCalculator.projectionPoints(
            startWeightKg: currentWeightKg,
            goalWeightKg: profile.goalWeightKg,
            heightCm: profile.heightCm,
            ageYears: age,
            sex: profile.sex,
            activityLevel: profile.activityLevel,
            dailyDeficitKcal: profile.deficitKcal,
            startDate: startDate
        ).map { WeightProjectionPoint(date: $0.date, weightKg: $0.weightKg) }
    }

    private func clearDerivedData() {
        chartWeighInsAscending = []
        weeklyRateKg = nil
        projectedGoalDate = nil
        projectionPoints = []
    }
}
