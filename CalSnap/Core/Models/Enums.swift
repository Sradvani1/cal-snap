enum BiologicalSex: String, Codable, CaseIterable {
    case male, female
}

enum ActivityLevel: String, Codable, CaseIterable {
    case sedentary = "Sedentary"
    case lightlyActive = "Lightly Active"
    case moderatelyActive = "Moderately Active"
    case veryActive = "Very Active"
    case extraActive = "Extra Active"

    var multiplier: Double {
        switch self {
        case .sedentary: return AppConstants.ActivityMultipliers.sedentary
        case .lightlyActive: return AppConstants.ActivityMultipliers.lightlyActive
        case .moderatelyActive: return AppConstants.ActivityMultipliers.moderatelyActive
        case .veryActive: return AppConstants.ActivityMultipliers.veryActive
        case .extraActive: return AppConstants.ActivityMultipliers.extraActive
        }
    }

    var description: String {
        switch self {
        case .sedentary: return "Desk job, minimal movement"
        case .lightlyActive: return "Light exercise 1–3 days/week"
        case .moderatelyActive: return "Moderate exercise 3–5 days/week"
        case .veryActive: return "Hard exercise 6–7 days/week"
        case .extraActive: return "Physical job + hard daily exercise"
        }
    }
}

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
}
