import Foundation

struct WidgetData: Codable, Sendable, Equatable {
    let displayName: String
    let targetCalories: Int
    let consumedCalories: Int
    let proteinConsumedG: Double
    let carbsConsumedG: Double
    let fatConsumedG: Double
    let proteinTargetG: Double
    let carbsTargetG: Double
    let fatTargetG: Double
    let updatedAt: Date
}

enum WidgetConstants {
    static let appGroupSuiteName = "group.com.calsnap.shared"
    static let storageKey = "widgetData"
}
