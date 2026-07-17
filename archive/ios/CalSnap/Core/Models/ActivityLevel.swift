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

    var localizedTitle: String {
        switch self {
        case .sedentary: String(localized: "model.activityLevel.sedentary.title")
        case .lightlyActive: String(localized: "model.activityLevel.lightlyActive.title")
        case .moderatelyActive: String(localized: "model.activityLevel.moderatelyActive.title")
        case .veryActive: String(localized: "model.activityLevel.veryActive.title")
        case .extraActive: String(localized: "model.activityLevel.extraActive.title")
        }
    }

    var description: String {
        switch self {
        case .sedentary: String(localized: "model.activityLevel.sedentary.description")
        case .lightlyActive: String(localized: "model.activityLevel.lightlyActive.description")
        case .moderatelyActive: String(localized: "model.activityLevel.moderatelyActive.description")
        case .veryActive: String(localized: "model.activityLevel.veryActive.description")
        case .extraActive: String(localized: "model.activityLevel.extraActive.description")
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
