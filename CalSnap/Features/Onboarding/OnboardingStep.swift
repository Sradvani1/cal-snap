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
        case .welcome: String(localized: "onboarding.step.welcome")
        case .profileSetup: String(localized: "onboarding.step.profile")
        case .goalSetup: String(localized: "onboarding.step.goals")
        case .caloriePreview: String(localized: "onboarding.step.calorieTarget")
        case .healthKit: String(localized: "onboarding.step.healthKit")
        case .apiKeys: String(localized: "onboarding.step.apiKeys")
        case .done: String(localized: "onboarding.step.done")
        }
    }
}
