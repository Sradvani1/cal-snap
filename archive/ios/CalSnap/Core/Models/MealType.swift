import Foundation

enum MealType: String, Codable, CaseIterable {
    case breakfast, lunch, dinner, snack

    static func suggested(for date: Date) -> MealType {
        let hour = Calendar.current.component(.hour, from: date)
        switch hour {
        case 5..<11: return .breakfast
        case 11..<15: return .lunch
        case 15..<18: return .snack
        default: return .dinner
        }
    }

    var displayName: String {
        switch self {
        case .breakfast: String(localized: "model.mealType.breakfast")
        case .lunch: String(localized: "model.mealType.lunch")
        case .dinner: String(localized: "model.mealType.dinner")
        case .snack: String(localized: "model.mealType.snack")
        }
    }

    var systemImage: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.fill"
        case .snack: return "leaf.fill"
        }
    }
}
