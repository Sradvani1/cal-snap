import Foundation

enum OnboardingStep: Int, CaseIterable, Hashable {
    case welcome
    case profileSetup
    case goalSetup
    case caloriePreview
    case healthKit
    case apiKeys
    case done

    var title: String {
        switch self {
        case .welcome: return "Welcome"
        case .profileSetup: return "Profile"
        case .goalSetup: return "Goals"
        case .caloriePreview: return "Calorie Target"
        case .healthKit: return "Apple Health"
        case .apiKeys: return "API Keys"
        case .done: return "Done"
        }
    }
}
