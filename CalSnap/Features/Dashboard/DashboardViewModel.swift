import Foundation
import SwiftData

enum CalorieProgressBand {
    case under
    case onTrack
    case over
}

enum FiberProgressBand {
    case low
    case moderate
    case onTrack
}

@MainActor
@Observable
final class DashboardViewModel {
    var activeProfile: UserProfile?
    var profiles: [UserProfile] = []
    var todaysMeals: [MealEntry] = []
    var mealsByType: [MealType: [MealEntry]] = [:]
    var todaysCalories = 0
    var todaysProteinG = 0.0
    var todaysCarbsG = 0.0
    var todaysFatG = 0.0
    var todaysFiberG = 0.0
    var chartWeighIns: [WeighIn] = []
    var plateauWeighIns: [WeighIn] = []
    var latestWeighInKg: Double?
    var showPlateauAlert = false
    var loadError: String?

    /// When `true`, `persistProfile` returns `false` without calling `context.save()`.
    internal var simulatePersistProfileFailure = false

    private let userProfileRepository: UserProfileRepository
    private let mealRepository: MealRepository
    private let weighInRepository: WeighInRepository

    init(
        userProfileRepository: UserProfileRepository,
        mealRepository: MealRepository,
        weighInRepository: WeighInRepository
    ) {
        self.userProfileRepository = userProfileRepository
        self.mealRepository = mealRepository
        self.weighInRepository = weighInRepository
    }

    var calorieProgress: Double {
        let target = Double(activeProfile?.dailyCalorieTarget ?? 2000)
        guard target > 0 else { return 0 }
        return Double(todaysCalories) / target
    }

    var calorieProgressBand: CalorieProgressBand {
        Self.progressBand(for: calorieProgress)
    }

    var remainingCalories: Int {
        (activeProfile?.dailyCalorieTarget ?? 2000) - todaysCalories
    }

    var macroTargets: (proteinG: Double, carbsG: Double, fatG: Double) {
        guard let profile = activeProfile else {
            return (0, 0, 0)
        }
        return NutritionCalculator.macroTargets(
            dailyCalories: profile.dailyCalorieTarget,
            proteinPct: profile.macroTargetProteinPct,
            carbsPct: profile.macroTargetCarbsPct,
            fatPct: profile.macroTargetFatPct
        )
    }

    var fiberTargetG: Double {
        let target = Double(activeProfile?.dailyCalorieTarget ?? 0)
        return (target / 1000.0) * AppConstants.Nutrition.fiberGramsPer1000Kcal
    }

    var fiberProgressRatio: Double {
        let target = fiberTargetG
        guard target > 0 else { return 0 }
        return todaysFiberG / target
    }

    var fiberProgressBand: FiberProgressBand {
        switch fiberProgressRatio {
        case 0.9...: return .onTrack
        case 0.7..<0.9: return .moderate
        default: return .low
        }
    }

    var netCalorieDelta: Int {
        todaysCalories - (activeProfile?.dailyCalorieTarget ?? 0)
    }

    var actualMacroPercents: (protein: Int, carbs: Int, fat: Int) {
        let proteinKcal = todaysProteinG * AppConstants.Nutrition.proteinCalPerGram
        let carbsKcal = todaysCarbsG * AppConstants.Nutrition.carbsCalPerGram
        let fatKcal = todaysFatG * AppConstants.Nutrition.fatCalPerGram
        let total = proteinKcal + carbsKcal + fatKcal
        guard total > 0 else { return (0, 0, 0) }
        return (
            protein: Int((proteinKcal / total * 100).rounded()),
            carbs: Int((carbsKcal / total * 100).rounded()),
            fat: Int((fatKcal / total * 100).rounded())
        )
    }

    var targetMacroPercents: (protein: Int, carbs: Int, fat: Int) {
        guard let profile = activeProfile else { return (0, 0, 0) }
        return (
            protein: Int((profile.macroTargetProteinPct * 100).rounded()),
            carbs: Int((profile.macroTargetCarbsPct * 100).rounded()),
            fat: Int((profile.macroTargetFatPct * 100).rounded())
        )
    }

    var netCalorieSummary: String {
        let delta = netCalorieDelta
        if delta > 0 {
            return "+\(delta) over goal"
        }
        if delta < 0 {
            return "\(delta) under goal"
        }
        return "On target"
    }

    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date.now)
        let prefix: String
        switch hour {
        case 5..<12: prefix = "Good morning"
        case 12..<17: prefix = "Good afternoon"
        case 17..<22: prefix = "Good evening"
        default: prefix = "Hello"
        }
        guard let name = activeProfile?.name, !name.isEmpty else { return prefix }
        return "\(prefix), \(name)"
    }

    var formattedDate: String {
        Date.now.formatted(date: .complete, time: .omitted)
    }

    var useLbsForDisplay: Bool {
        Locale.current.measurementSystem != .metric
    }

    var hasSecondProfile: Bool {
        profiles.count > 1
    }

    static func progressBand(for ratio: Double) -> CalorieProgressBand {
        switch ratio {
        case ..<0.90: return .under
        case 0.90..<1.10: return .onTrack
        default: return .over
        }
    }

    func loadToday(context: ModelContext, activeUserId: String) {
        loadError = nil
        clearTodayData()
        do {
            profiles = try userProfileRepository.fetchAll(context: context)
            activeProfile = resolveActiveProfile(from: profiles, activeUserId: activeUserId)
            guard let profile = activeProfile else { return }

            todaysMeals = try mealRepository.fetchMeals(for: profile.id, on: Date.now, context: context)
            aggregateMeals()

            let calendar = Calendar.current
            let referenceDate = Date.now
            let endOfDay = calendar.startOfDay(for: referenceDate)
            let startOfWindow = calendar.date(byAdding: .day, value: -6, to: endOfDay) ?? endOfDay

            chartWeighIns = try weighInRepository.fetchWeighIns(
                for: profile.id,
                from: startOfWindow,
                through: referenceDate,
                context: context
            )
            plateauWeighIns = try weighInRepository.fetchWeeklyPlateauWeighIns(
                for: profile.id,
                count: AppConstants.Plateau.weeksToDetect,
                context: context
            )
            let latest = try weighInRepository.fetchLatestWeighIns(
                for: profile.id,
                count: 1,
                context: context
            )
            latestWeighInKg = latest.last?.weightKg
            checkForPlateau()
        } catch {
            loadError = error.localizedDescription
            showPlateauAlert = false
        }
    }

    func latestWeighInKg(for profileId: UUID, context: ModelContext) -> Double? {
        (try? weighInRepository.fetchLatestWeighIns(
            for: profileId,
            count: 1,
            context: context
        ).last?.weightKg)
    }

    func checkForPlateau() {
        guard let profile = activeProfile else {
            showPlateauAlert = false
            return
        }

        if isMaintenanceActive(for: profile.id) || isPlateauSnoozed(for: profile.id) {
            showPlateauAlert = false
            return
        }

        guard plateauWeighIns.count >= AppConstants.Plateau.weeksToDetect else {
            showPlateauAlert = false
            return
        }

        showPlateauAlert = NutritionCalculator.isOnPlateau(weighIns: plateauWeighIns)
    }

    func applyDietBreak(context: ModelContext) {
        guard let profile = activeProfile else { return }

        let previousTarget = profile.dailyCalorieTarget
        let previousDeficit = profile.deficitKcal
        let previousUpdatedAt = profile.updatedAt

        profile.dailyCalorieTarget = profile.tdee
        profile.deficitKcal = 0
        profile.updatedAt = Date.now

        guard persistProfile(context: context) else {
            profile.dailyCalorieTarget = previousTarget
            profile.deficitKcal = previousDeficit
            profile.updatedAt = previousUpdatedAt
            return
        }

        let maintenanceEnd = Calendar.current.date(byAdding: .day, value: 14, to: Date.now) ?? Date.now
        storeDate(maintenanceEnd, forKey: AppStorageKey.maintenanceModeUntil(userId: profile.id))
        showPlateauAlert = false
    }

    func applySmallReduction(context: ModelContext) {
        guard let profile = activeProfile else { return }

        let previousTarget = profile.dailyCalorieTarget
        let previousDeficit = profile.deficitKcal
        let previousUpdatedAt = profile.updatedAt

        let minimum = minimumCalories(for: profile.sex)
        profile.dailyCalorieTarget = max(minimum, previousTarget - 60)
        profile.deficitKcal = profile.tdee - profile.dailyCalorieTarget
        profile.updatedAt = Date.now

        guard persistProfile(context: context) else {
            profile.dailyCalorieTarget = previousTarget
            profile.deficitKcal = previousDeficit
            profile.updatedAt = previousUpdatedAt
            return
        }

        showPlateauAlert = false
    }

    func dismissPlateauAlert() {
        if let profile = activeProfile {
            let snoozeEnd = Calendar.current.date(byAdding: .day, value: 14, to: Date.now) ?? Date.now
            storeDate(snoozeEnd, forKey: AppStorageKey.plateauSnoozeUntil(userId: profile.id))
        }
        showPlateauAlert = false
    }

    private func resolveActiveProfile(from profiles: [UserProfile], activeUserId: String) -> UserProfile? {
        if let id = UUID(uuidString: activeUserId),
           let match = profiles.first(where: { $0.id == id }) {
            return match
        }
        return profiles.first
    }

    private func clearTodayData() {
        todaysMeals = []
        mealsByType = [:]
        todaysCalories = 0
        todaysProteinG = 0
        todaysCarbsG = 0
        todaysFatG = 0
        todaysFiberG = 0
        chartWeighIns = []
        plateauWeighIns = []
        latestWeighInKg = nil
        showPlateauAlert = false
    }

    private func aggregateMeals() {
        todaysCalories = 0
        todaysProteinG = 0
        todaysCarbsG = 0
        todaysFatG = 0
        todaysFiberG = 0

        var grouped: [MealType: [MealEntry]] = [:]
        for meal in todaysMeals {
            todaysCalories += meal.totalCalories
            todaysProteinG += meal.totalProteinG
            todaysCarbsG += meal.totalCarbsG
            todaysFatG += meal.totalFatG
            todaysFiberG += meal.totalFiberG
            grouped[meal.mealType, default: []].append(meal)
        }
        mealsByType = grouped
    }

    @discardableResult
    private func persistProfile(context: ModelContext) -> Bool {
        if simulatePersistProfileFailure {
            loadError = "Simulated save failure"
            return false
        }
        do {
            try context.save()
            return true
        } catch {
            loadError = error.localizedDescription
            return false
        }
    }

    private func minimumCalories(for sex: BiologicalSex) -> Int {
        sex == .male
            ? AppConstants.Deficit.minCaloriesMale
            : AppConstants.Deficit.minCaloriesFemale
    }

    private func isMaintenanceActive(for userId: UUID) -> Bool {
        guard let endDate = storedDate(forKey: AppStorageKey.maintenanceModeUntil(userId: userId)) else {
            return false
        }
        return endDate > Date.now
    }

    private func isPlateauSnoozed(for userId: UUID) -> Bool {
        guard let endDate = storedDate(forKey: AppStorageKey.plateauSnoozeUntil(userId: userId)) else {
            return false
        }
        return endDate > Date.now
    }

    private func storedDate(forKey key: String) -> Date? {
        let interval = UserDefaults.standard.double(forKey: key)
        guard interval > 0 else { return nil }
        return Date(timeIntervalSince1970: interval)
    }

    private func storeDate(_ date: Date, forKey key: String) {
        UserDefaults.standard.set(date.timeIntervalSince1970, forKey: key)
    }
}
