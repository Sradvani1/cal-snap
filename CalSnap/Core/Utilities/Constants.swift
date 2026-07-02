import Foundation

enum AppStorageKey {
    static let profileDataRevision = "profileDataRevision"
    static let healthKitWritesEnabled = "healthKitWritesEnabled"
    static let healthKitWeightReadsEnabled = "healthKitWeightReadsEnabled"
    static let useLbsForWeight = "useLbsForWeight"
    static let useImperialForHeight = "useImperialForHeight"

    static func bumpProfileDataRevision() {
        let current = UserDefaults.standard.integer(forKey: profileDataRevision)
        UserDefaults.standard.set(current + 1, forKey: profileDataRevision)
    }

    static var healthKitWritesEnabledValue: Bool {
        UserDefaults.standard.object(forKey: healthKitWritesEnabled) as? Bool ?? true
    }

    static var healthKitWeightReadsEnabledValue: Bool {
        UserDefaults.standard.object(forKey: healthKitWeightReadsEnabled) as? Bool ?? true
    }

    static var useLbsForWeightValue: Bool {
        UserDefaults.standard.object(forKey: useLbsForWeight) as? Bool ?? true
    }

    static func plateauSnoozeUntil(userId: UUID) -> String {
        "plateauSnoozeUntil_\(userId.uuidString)"
    }

    static func maintenanceModeUntil(userId: UUID) -> String {
        "maintenanceModeUntil_\(userId.uuidString)"
    }

    static func weighInSnoozeUntil(userId: UUID) -> String {
        "weighInSnoozeUntil_\(userId.uuidString)"
    }

    static func weighInReminderWeekday(userId: UUID) -> String {
        "weighInReminderWeekday_\(userId.uuidString)"
    }

    static func weighInReminderHour(userId: UUID) -> String {
        "weighInReminderHour_\(userId.uuidString)"
    }

    static func weighInReminderMinute(userId: UUID) -> String {
        "weighInReminderMinute_\(userId.uuidString)"
    }

    static func dailyLogReminderEnabled(userId: UUID) -> String {
        "dailyLogReminderEnabled_\(userId.uuidString)"
    }

    static func dailyLogReminderHour(userId: UUID) -> String {
        "dailyLogReminderHour_\(userId.uuidString)"
    }

    static func dailyLogReminderMinute(userId: UUID) -> String {
        "dailyLogReminderMinute_\(userId.uuidString)"
    }
}

enum AppConstants {
    enum Gemini {
        static let model = "gemini-2.5-flash"
        static let maxTokens = 2048
        static let confidenceThreshold: Double = 0.60
    }

    enum Nutrition {
        static let carbsCalPerGram: Double = 4.0
        static let proteinCalPerGram: Double = 4.0
        static let fatCalPerGram: Double = 9.0
        static let fiberCalPerGram: Double = 2.0
        static let alcoholCalPerGram: Double = 7.0
        static let fiberGramsPer1000Kcal: Double = 14.0
        static let defaultMacroProteinPct: Double = 0.28
        static let defaultMacroCarbsPct: Double = 0.47
        static let defaultMacroFatPct: Double = 0.25
    }

    enum Deficit {
        static let defaultDeficitKcal: Int = 350
        static let minDeficitKcal: Int = 100
        static let maxDeficitKcal: Int = 500
        static let hardMaxDeficitKcal: Int = 750
        static let minCaloriesMale: Int = 1500
        static let minCaloriesFemale: Int = 1200
    }

    enum ActivityMultipliers {
        static let sedentary: Double = 1.2
        static let lightlyActive: Double = 1.375
        static let moderatelyActive: Double = 1.55
        static let veryActive: Double = 1.725
        static let extraActive: Double = 1.9
    }

    enum Plateau {
        static let weeksToDetect: Int = 3
        static let weightChangeThresholdKg: Double = 0.23
        static let weeklyMinimumDaySpacing = 6
    }

    enum WeightProjection {
        static let maxWeeks = 104
    }

    enum USDA {
        static let baseURL = "https://api.nal.usda.gov/fdc/v1"
        static let demoAPIKey = "DEMO_KEY"
    }

    enum Onboarding {
        static let minAgeYears = 18
        static let maxAgeYears = 90
        static let minGoalDaysFromToday = 14
        static let maxGoalDaysFromToday = 730
    }

    enum Notifications {
        static let weighInCategoryIdentifier = "WEIGH_IN"
        static let dailyLogCategoryIdentifier = "DAILY_LOG"
        static let defaultReminderWeekday = 1 // Sunday
        static let defaultReminderHour = 8
        static let defaultReminderMinute = 0
        static let defaultDailyLogReminderHour = 20
        static let defaultDailyLogReminderMinute = 0
    }

    enum MealPhoto {
        static let maxLongEdgePx = 1280
        static let minLongEdgePx = 896
        static let initialJPEGQuality = 0.72
        static let minJPEGQuality = 0.50
        /// QA target for typical meals; not runtime-enforced (retry triggers only on `hardMaxBytes`).
        static let preferredMaxBytes = 500_000
        /// QA upper bound for difficult images; not runtime-enforced (retry triggers only on `hardMaxBytes`).
        static let softMaxBytes = 750_000
        static let hardMaxBytes = 1_000_000
        static let outputMIMEType = "image/jpeg"

        static let qualityRetrySteps: [Double] = [initialJPEGQuality, 0.65, 0.60, 0.55, minJPEGQuality]
        static let longEdgeRetrySteps: [Double] = [
            Double(maxLongEdgePx), 1152, 1024, Double(minLongEdgePx),
        ]
    }
}
