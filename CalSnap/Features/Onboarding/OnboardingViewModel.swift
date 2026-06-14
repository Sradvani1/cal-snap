import Foundation
import SwiftData
import SwiftUI

enum GeminiTestState: Equatable {
    case idle
    case testing
    case success
    case failure(String)
}

@Observable
@MainActor
final class OnboardingViewModel {
    var currentStep: OnboardingStep = .welcome
    var profileA = ProfileDraft()
    var profileB = ProfileDraft()
    var currentProfileIndex = 0

    var calculatedTDEE = 0
    var calculatedTarget = 0
    var calculatedDeficit = AppConstants.Deficit.defaultDeficitKcal
    var calculatedProteinG = 0.0
    var calculatedCarbsG = 0.0
    var calculatedFatG = 0.0
    var warnings: [String] = []
    var isCalculating = false

    var geminiAPIKeyInput = ""
    var usdaAPIKeyInput = ""
    var geminiTestState: GeminiTestState = .idle
    var hardDeficitUnlocked = false
    var showHardDeficitAlert = false
    var validationError: String?

    var useImperialHeight = false
    var useLbsWeight = false
    var useLbsGoalWeight = false

    private let healthKitService: HealthKitService
    private let geminiService: GeminiService
    private let userProfileRepository: UserProfileRepository

    init(
        healthKitService: HealthKitService,
        geminiService: GeminiService,
        userProfileRepository: UserProfileRepository
    ) {
        self.healthKitService = healthKitService
        self.geminiService = geminiService
        self.userProfileRepository = userProfileRepository
    }

    var activeProfile: ProfileDraft {
        get { currentProfileIndex == 0 ? profileA : profileB }
        set {
            if currentProfileIndex == 0 {
                profileA = newValue
            } else {
                profileB = newValue
            }
        }
    }

    var activeProfileTitle: String {
        if currentProfileIndex == 0 {
            return profileA.trimmedName.isEmpty ? "Your profile" : profileA.trimmedName
        }
        return profileB.trimmedName.isEmpty ? "Partner's profile" : profileB.trimmedName
    }

    var hasPartner: Bool {
        !profileB.trimmedName.isEmpty
    }

    var progress: Double {
        Double(currentStep.rawValue + 1) / Double(OnboardingStep.allCases.count)
    }

    func canAdvance(from step: OnboardingStep) -> Bool {
        switch step {
        case .welcome:
            return !profileA.trimmedName.isEmpty
        case .profileSetup:
            return !activeProfile.trimmedName.isEmpty && validateDateOfBirth(activeProfile.dateOfBirth)
        case .goalSetup:
            return validateGoalTargetDate(activeProfile.goalTargetDate)
        case .caloriePreview, .healthKit, .apiKeys, .done:
            return true
        }
    }

    func validateGoalTargetDate(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        let target = calendar.startOfDay(for: date)
        guard let minDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.minGoalDaysFromToday, to: start),
              let maxDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.maxGoalDaysFromToday, to: start)
        else {
            return false
        }
        return target >= minDate && target <= maxDate
    }

    func validateDateOfBirth(_ date: Date) -> Bool {
        let age = NutritionCalculator.age(from: date)
        return age >= AppConstants.Onboarding.minAgeYears && age <= AppConstants.Onboarding.maxAgeYears
    }

    func calculateTargets() {
        isCalculating = true
        defer { isCalculating = false }

        let draft = activeProfile
        let age = NutritionCalculator.age(from: draft.dateOfBirth)
        let bmr = NutritionCalculator.bmr(
            weightKg: draft.weightKg,
            heightCm: draft.heightCm,
            ageYears: age,
            sex: draft.sex
        )
        let tdeeValue = NutritionCalculator.tdee(bmr: bmr, activityLevel: draft.activityLevel)
        let targetResult = NutritionCalculator.dailyTarget(
            tdee: tdeeValue,
            requestedDeficit: draft.requestedDeficit,
            sex: draft.sex
        )
        let macros = NutritionCalculator.macroTargets(
            dailyCalories: targetResult.target,
            proteinPct: 0.28,
            carbsPct: 0.47,
            fatPct: 0.25
        )

        calculatedTDEE = Int(tdeeValue.rounded())
        calculatedTarget = targetResult.target
        calculatedDeficit = targetResult.deficit
        calculatedProteinG = macros.proteinG
        calculatedCarbsG = macros.carbsG
        calculatedFatG = macros.fatG
        warnings = targetResult.warnings
    }

    func updateDeficit(_ value: Int) {
        var draft = activeProfile
        let maxAllowed = hardDeficitUnlocked
            ? AppConstants.Deficit.hardMaxDeficitKcal
            : AppConstants.Deficit.maxDeficitKcal
        draft.requestedDeficit = min(max(value, AppConstants.Deficit.minDeficitKcal), maxAllowed)
        activeProfile = draft
        calculateTargets()
    }

    func unlockHardDeficit() {
        hardDeficitUnlocked = true
        if activeProfile.requestedDeficit > AppConstants.Deficit.maxDeficitKcal {
            updateDeficit(activeProfile.requestedDeficit)
        }
    }

    func advance(context: ModelContext) throws {
        validationError = nil
        guard canAdvance(from: currentStep) else {
            validationError = validationMessage(for: currentStep)
            return
        }

        switch currentStep {
        case .welcome:
            currentProfileIndex = 0
            currentStep = .profileSetup
        case .profileSetup:
            currentStep = .goalSetup
        case .goalSetup:
            currentStep = .caloriePreview
            calculateTargets()
        case .caloriePreview:
            if currentProfileIndex == 0, hasPartner {
                currentProfileIndex = 1
                hardDeficitUnlocked = false
                currentStep = .profileSetup
            } else {
                currentStep = .healthKit
            }
        case .healthKit:
            currentStep = .apiKeys
        case .apiKeys:
            try saveAPIKeys()
            try saveProfiles(context: context)
            currentStep = .done
        case .done:
            break
        }
    }

    func goBack() {
        validationError = nil
        switch currentStep {
        case .welcome:
            break
        case .profileSetup:
            if currentProfileIndex == 1 {
                currentProfileIndex = 0
                currentStep = .caloriePreview
                calculateTargets()
            } else {
                currentStep = .welcome
            }
        case .goalSetup:
            currentStep = .profileSetup
        case .caloriePreview:
            currentStep = .goalSetup
        case .healthKit:
            currentProfileIndex = hasPartner ? 1 : 0
            currentStep = .caloriePreview
            calculateTargets()
        case .apiKeys:
            currentStep = .healthKit
        case .done:
            currentStep = .apiKeys
        }
    }

    func saveAPIKeys() throws {
        let gemini = geminiAPIKeyInput.trimmingCharacters(in: .whitespacesAndNewlines)
        if !gemini.isEmpty {
            try KeychainManager.save(gemini, for: .geminiAPIKey)
        }

        let usda = usdaAPIKeyInput.trimmingCharacters(in: .whitespacesAndNewlines)
        if !usda.isEmpty {
            try KeychainManager.save(usda, for: .usdaAPIKey)
        }
    }

    func saveProfiles(context: ModelContext) throws {
        let profileARecord = userProfileRepository.makeUserProfile(from: profileA)
        var profiles = [profileARecord]
        if hasPartner {
            profiles.append(userProfileRepository.makeUserProfile(from: profileB))
        }
        try userProfileRepository.save(profiles, context: context)
        UserDefaults.standard.set(profileARecord.id.uuidString, forKey: AppStorageKey.activeUserId)
    }

    func requestHealthKit() {
        Task {
            try? await healthKitService.requestAuthorization()
        }
    }

    func testGeminiKey() async {
        let key = geminiAPIKeyInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty else {
            geminiTestState = .failure("Enter an API key to test.")
            return
        }

        geminiTestState = .testing
        do {
            _ = try await geminiService.validateAPIKey(key)
            geminiTestState = .success
        } catch {
            geminiTestState = .failure(error.localizedDescription)
        }
    }

    private func validationMessage(for step: OnboardingStep) -> String {
        switch step {
        case .welcome:
            return "Enter your name to continue."
        case .profileSetup:
            if activeProfile.trimmedName.isEmpty {
                return "Enter a name to continue."
            }
            return "Age must be between \(AppConstants.Onboarding.minAgeYears) and \(AppConstants.Onboarding.maxAgeYears)."
        case .goalSetup:
            return "Goal date must be 2 weeks to 2 years from today."
        default:
            return "Complete required fields to continue."
        }
    }
}
