import Foundation

enum AnalyticsDateRange: Hashable, Sendable {
    case days(Int)
    case custom(start: Date, end: Date)

    static let maxCustomSpanDays = 365

    func resolvedEnd(reference: Date, calendar: Calendar = .current) -> Date {
        switch self {
        case .days:
            return calendar.startOfDay(for: reference)
        case .custom(_, let end):
            return calendar.startOfDay(for: min(end, reference))
        }
    }

    func resolvedStart(reference: Date, calendar: Calendar = .current) -> Date {
        let end = resolvedEnd(reference: reference, calendar: calendar)
        switch self {
        case .days(let count):
            return calendar.date(byAdding: .day, value: -(count - 1), to: end) ?? end
        case .custom(let start, _):
            let normalizedStart = calendar.startOfDay(for: start)
            let normalizedEnd = end
            if normalizedStart <= normalizedEnd {
                return normalizedStart
            }
            return normalizedEnd
        }
    }

    var displayLabel: String {
        switch self {
        case .days(7): return String(localized: "model.analytics.timeframe.7d")
        case .days(30): return String(localized: "model.analytics.timeframe.30d")
        case .days(90): return String(localized: "model.analytics.timeframe.90d")
        case .days(let n): return String(format: String(localized: "model.analytics.timeframe.daysFormat"), n)
        case .custom: return String(localized: "model.analytics.timeframe.custom")
        }
    }
}

enum AnalyticsTimeframePreset: String, CaseIterable, Identifiable {
    case days7 = "7D"
    case days30 = "30D"
    case days90 = "90D"
    case custom = "Custom"

    var id: String { rawValue }

    var dateRange: AnalyticsDateRange {
        switch self {
        case .days7: return .days(7)
        case .days30: return .days(30)
        case .days90: return .days(90)
        case .custom: return .days(7)
        }
    }
}

struct DailyNutritionSummary: Sendable, Identifiable, Hashable {
    let date: Date
    let calories: Int
    let proteinG: Double
    let carbsG: Double
    let fatG: Double
    let fiberG: Double

    var id: Date { date }
}

struct MacroSplit: Sendable, Equatable {
    let proteinPct: Int
    let carbsPct: Int
    let fatPct: Int
}

enum Weekday: Int, CaseIterable, Sendable {
    case sunday = 1
    case monday
    case tuesday
    case wednesday
    case thursday
    case friday
    case saturday

    init?(calendarWeekday: Int) {
        self.init(rawValue: calendarWeekday)
    }

    var shortLabel: String {
        switch self {
        case .sunday: String(localized: "model.analytics.weekday.sun")
        case .monday: String(localized: "model.analytics.weekday.mon")
        case .tuesday: String(localized: "model.analytics.weekday.tue")
        case .wednesday: String(localized: "model.analytics.weekday.wed")
        case .thursday: String(localized: "model.analytics.weekday.thu")
        case .friday: String(localized: "model.analytics.weekday.fri")
        case .saturday: String(localized: "model.analytics.weekday.sat")
        }
    }

    var isWeekend: Bool {
        self == .saturday || self == .sunday
    }
}

enum TimeOfDayBucket: String, CaseIterable, Sendable {
    case morning
    case midday
    case evening
    case night

    var displayLabel: String {
        switch self {
        case .morning: String(localized: "model.analytics.timeOfDay.morning")
        case .midday: String(localized: "model.analytics.timeOfDay.midday")
        case .evening: String(localized: "model.analytics.timeOfDay.evening")
        case .night: String(localized: "model.analytics.timeOfDay.night")
        }
    }

    static func bucket(for hour: Int) -> TimeOfDayBucket {
        switch hour {
        case 5..<11: return .morning
        case 11..<15: return .midday
        case 15..<21: return .evening
        default: return .night
        }
    }
}

struct TopFoodEntry: Sendable, Identifiable, Equatable {
    let name: String
    let count: Int
    let avgCalories: Int

    var id: String { name }
}

struct AnalyticsInsightPayload: Sendable {
    let timeframeLabel: String
    let loggedDayCount: Int
    let averageDailyCalories: Int
    let calorieTarget: Int
    let adherencePercent: Double
    let actualMacroSplit: MacroSplit
    let targetMacroSplit: MacroSplit
    let averageDailyFiberG: Double
    let fiberTargetG: Double
    let weekendAverageCalories: Int?
    let weekdayAverageCalories: Int?
    let topFoods: [TopFoodEntry]
    let weightChangeKg: Double?
}
