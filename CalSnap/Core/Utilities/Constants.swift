import Foundation

enum AppStorageKey {
    static let activeUserId = "activeUserId"

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
        static let minDeficitKcal: Int = 250
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
        static let defaultReminderWeekday = 1 // Sunday
        static let defaultReminderHour = 8
        static let defaultReminderMinute = 0
    }
}
