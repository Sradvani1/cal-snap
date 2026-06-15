import Foundation
import SwiftData

@MainActor
@Observable
final class AnalyticsViewModel {
    var selectedRange: AnalyticsDateRange = .days(7)
    var profiles: [UserProfile] = []
    var activeProfile: UserProfile?
    var meals: [MealEntry] = []
    var loadError: String?

    private(set) var loggedDays: [DailyNutritionSummary] = []
    private(set) var chartDailySeries: [DailyNutritionSummary] = []
    private(set) var adherencePct: Double = 0
    private(set) var averageDailyCalories: Int = 0
    private(set) var actualMacroSplit = MacroSplit(proteinPct: 0, carbsPct: 0, fatPct: 0)
    private(set) var targetMacroSplit = MacroSplit(proteinPct: 0, carbsPct: 0, fatPct: 0)
    private(set) var fiberTargetG: Double = 0
    private(set) var daysMeetingFiberTarget: Int = 0
    private(set) var dayOfWeekBreakdown: [Weekday: Int] = [:]
    private(set) var timeOfDayBreakdown: [TimeOfDayBucket: Int] = [:]
    private(set) var topFoods: [TopFoodEntry] = []
    private(set) var weekendAverageCalories: Int?
    private(set) var weekdayAverageCalories: Int?
    private(set) var loggedDayCount: Int = 0

    var aiInsightText: String?
    var insightError: String?
    var isGeneratingInsight = false

    private let userProfileRepository: UserProfileRepository
    private let mealRepository: MealRepository
    private let weighInRepository: WeighInRepository
    private var weighInsInRange: [WeighIn] = []

    init(
        userProfileRepository: UserProfileRepository,
        mealRepository: MealRepository,
        weighInRepository: WeighInRepository
    ) {
        self.userProfileRepository = userProfileRepository
        self.mealRepository = mealRepository
        self.weighInRepository = weighInRepository
    }

    var hasEnoughData: Bool {
        loggedDayCount >= 3
    }

    var calorieTarget: Int {
        activeProfile?.dailyCalorieTarget ?? 0
    }

    var useLbsForDisplay: Bool {
        Locale.current.measurementSystem != .metric
    }

    func load(context: ModelContext, activeUserId: String) {
        loadError = nil

        do {
            profiles = try userProfileRepository.fetchAll(context: context)
            activeProfile = resolveActiveProfile(from: profiles, activeUserId: activeUserId)
            guard let profile = activeProfile else {
                clearAggregates()
                return
            }

            let referenceDate = Date.now
            let rangeStart = selectedRange.resolvedStart(reference: referenceDate)
            let rangeEnd = selectedRange.resolvedEnd(reference: referenceDate)

            meals = try mealRepository.fetchMeals(
                for: profile.id,
                from: rangeStart,
                through: rangeEnd,
                context: context
            )

            loggedDays = AnalyticsAggregator.loggedDailySummaries(from: meals)
            chartDailySeries = AnalyticsAggregator.chartDailySeries(
                loggedDays: loggedDays,
                from: rangeStart,
                through: rangeEnd
            )
            loggedDayCount = loggedDays.count

            adherencePct = AnalyticsAggregator.adherencePercent(
                loggedDays: loggedDays,
                calorieTarget: profile.dailyCalorieTarget
            )
            averageDailyCalories = Int(
                AnalyticsAggregator.averageDailyCalories(loggedDays: loggedDays).rounded()
            )

            let totalProtein = loggedDays.reduce(0) { $0 + $1.proteinG }
            let totalCarbs = loggedDays.reduce(0) { $0 + $1.carbsG }
            let totalFat = loggedDays.reduce(0) { $0 + $1.fatG }
            actualMacroSplit = AnalyticsAggregator.macroSplit(
                proteinG: totalProtein,
                carbsG: totalCarbs,
                fatG: totalFat
            )
            targetMacroSplit = MacroSplit(
                proteinPct: Int((profile.macroTargetProteinPct * 100).rounded()),
                carbsPct: Int((profile.macroTargetCarbsPct * 100).rounded()),
                fatPct: Int((profile.macroTargetFatPct * 100).rounded())
            )

            fiberTargetG = NutritionCalculator.fiberTargetG(dailyCalorieTarget: profile.dailyCalorieTarget)
            daysMeetingFiberTarget = AnalyticsAggregator.daysMeetingFiberTarget(
                loggedDays: loggedDays,
                fiberTargetG: fiberTargetG
            )

            dayOfWeekBreakdown = AnalyticsAggregator.dayOfWeekBreakdown(meals: meals)
            timeOfDayBreakdown = AnalyticsAggregator.timeOfDayBreakdown(meals: meals)
            topFoods = AnalyticsAggregator.topFoods(meals: meals, limit: 5)

            if let averages = AnalyticsAggregator.weekendWeekdayAverages(loggedDays: loggedDays) {
                weekendAverageCalories = Int(averages.weekend.rounded())
                weekdayAverageCalories = Int(averages.weekday.rounded())
            } else {
                weekendAverageCalories = nil
                weekdayAverageCalories = nil
            }

            weighInsInRange = try weighInRepository.fetchWeighIns(
                for: profile.id,
                from: rangeStart,
                through: rangeEnd,
                context: context
            )
        } catch {
            loadError = error.localizedDescription
            clearAggregates()
        }
    }

    func generateInsight(geminiService: GeminiService) async {
        guard hasEnoughData, !isGeneratingInsight, let profile = activeProfile else { return }

        isGeneratingInsight = true
        insightError = nil
        defer { isGeneratingInsight = false }

        let averageFiber = loggedDays.isEmpty
            ? 0
            : loggedDays.reduce(0) { $0 + $1.fiberG } / Double(loggedDays.count)

        let weightChange: Double?
        if weighInsInRange.count >= 2,
           let first = weighInsInRange.first,
           let last = weighInsInRange.last {
            weightChange = last.weightKg - first.weightKg
        } else {
            weightChange = nil
        }

        let payload = AnalyticsInsightPayload(
            timeframeLabel: selectedRange.displayLabel,
            loggedDayCount: loggedDayCount,
            averageDailyCalories: averageDailyCalories,
            calorieTarget: profile.dailyCalorieTarget,
            adherencePercent: adherencePct,
            actualMacroSplit: actualMacroSplit,
            targetMacroSplit: targetMacroSplit,
            averageDailyFiberG: averageFiber,
            fiberTargetG: fiberTargetG,
            weekendAverageCalories: weekendAverageCalories,
            weekdayAverageCalories: weekdayAverageCalories,
            topFoods: Array(topFoods.prefix(3)),
            weightChangeKg: weightChange
        )

        do {
            aiInsightText = try await geminiService.generateAnalyticsInsight(payload)
        } catch GeminiError.apiKeyMissing {
            insightError = "Add your Gemini API key in Settings to generate insights."
        } catch let error as GeminiError {
            insightError = error.localizedDescription
        } catch {
            insightError = error.localizedDescription
        }
    }

    private func resolveActiveProfile(from profiles: [UserProfile], activeUserId: String) -> UserProfile? {
        if let uuid = UUID(uuidString: activeUserId),
           let match = profiles.first(where: { $0.id == uuid }) {
            return match
        }
        return profiles.first
    }

    private func clearAggregates() {
        meals = []
        loggedDays = []
        chartDailySeries = []
        adherencePct = 0
        averageDailyCalories = 0
        actualMacroSplit = MacroSplit(proteinPct: 0, carbsPct: 0, fatPct: 0)
        targetMacroSplit = MacroSplit(proteinPct: 0, carbsPct: 0, fatPct: 0)
        fiberTargetG = 0
        daysMeetingFiberTarget = 0
        dayOfWeekBreakdown = [:]
        timeOfDayBreakdown = [:]
        topFoods = []
        weekendAverageCalories = nil
        weekdayAverageCalories = nil
        loggedDayCount = 0
        weighInsInRange = []
    }
}
