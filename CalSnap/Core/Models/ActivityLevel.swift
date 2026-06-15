import Foundation

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

    var systemImage: String {
        switch self {
        case .sedentary: return "figure.seated.side"
        case .lightlyActive: return "figure.walk"
        case .moderatelyActive: return "figure.run"
        case .veryActive: return "figure.strengthtraining.traditional"
        case .extraActive: return "figure.highintensity.intervaltraining"
        }
    }
}
