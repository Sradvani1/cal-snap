import Foundation
import SwiftData
import SwiftUI

@MainActor
@Observable
final class OnboardingViewModel {
    var currentStep: OnboardingStep = .welcome
    var profileDraft = ProfileDraft()

    var calculatedTDEE = 0
    var calculatedTarget = 0
    var calculatedDeficit = AppConstants.Deficit.defaultDeficitKcal
    var calculatedProteinG = 0.0
    var calculatedCarbsG = 0.0
    var calculatedFatG = 0.0
    var warnings: [String] = []

    var geminiAPIKeyInput = ""
    var usdaAPIKeyInput = ""
    var geminiTestState: GeminiTestState = .idle
    var hardDeficitUnlocked = false
    var showHardDeficitAlert = false
    var validationError: String?
    var healthKitError: String?

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

    var progress: Double {
        Double(currentStep.rawValue + 1) / Double(OnboardingStep.allCases.count)
    }

    func updateProfileDraft(_ update: (inout ProfileDraft) -> Void) {
        update(&profileDraft)
    }

    func binding<T>(_ keyPath: WritableKeyPath<ProfileDraft, T>) -> Binding<T> {
        Binding(
            get: { self.profileDraft[keyPath: keyPath] },
            set: { newValue in
                self.updateProfileDraft { $0[keyPath: keyPath] = newValue }
            }
        )
    }

    func deficitSliderBinding() -> Binding<Double> {
        Binding(
            get: { Double(self.profileDraft.requestedDeficit) },
            set: { self.updateDeficit(Int($0)) }
        )
    }

    func canAdvance(from step: OnboardingStep) -> Bool {
        switch step {
        case .welcome:
            return true
        case .profileSetup:
            return validateDateOfBirth(profileDraft.dateOfBirth)
        case .goalSetup:
            return validateGoalTargetDate(profileDraft.goalTargetDate)
        case .caloriePreview, .healthKit, .apiKeys, .done:
            return true
        }
    }

    func validateGoalTargetDate(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date.now)
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
        let draft = profileDraft
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
            proteinPct: AppConstants.Nutrition.defaultMacroProteinPct,
            carbsPct: AppConstants.Nutrition.defaultMacroCarbsPct,
            fatPct: AppConstants.Nutrition.defaultMacroFatPct
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
        let maxAllowed = hardDeficitUnlocked
            ? AppConstants.Deficit.hardMaxDeficitKcal
            : AppConstants.Deficit.maxDeficitKcal
        profileDraft.requestedDeficit = min(max(value, AppConstants.Deficit.minDeficitKcal), maxAllowed)
        calculateTargets()
    }

    func unlockHardDeficit() {
        hardDeficitUnlocked = true
        if profileDraft.requestedDeficit > AppConstants.Deficit.maxDeficitKcal {
            updateDeficit(profileDraft.requestedDeficit)
        }
    }

    func advanceOrSetValidationError(context: ModelContext) {
        do {
            try advance(context: context)
        } catch {
            validationError = error.localizedDescription
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
            currentStep = .profileSetup
        case .profileSetup:
            profileDraft.useLbsGoalWeight = profileDraft.useLbsWeight
            currentStep = .goalSetup
        case .goalSetup:
            currentStep = .caloriePreview
            calculateTargets()
        case .caloriePreview:
            currentStep = .healthKit
        case .healthKit:
            currentStep = .apiKeys
        case .apiKeys:
            try saveProfile(context: context)
            do {
                try saveAPIKeys()
            } catch {
                validationError = String(format: String(localized: "onboarding.apiKeys.savePartialFailure"), error.localizedDescription)
            }
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
            currentStep = .welcome
        case .goalSetup:
            currentStep = .profileSetup
        case .caloriePreview:
            currentStep = .goalSetup
        case .healthKit:
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

    func saveProfile(context: ModelContext) throws {
        let profile = userProfileRepository.makeUserProfile(from: profileDraft)
        try userProfileRepository.save([profile], context: context)
        UserDefaults.standard.set(profileDraft.useLbsWeight, forKey: AppStorageKey.useLbsForWeight)
        UserDefaults.standard.set(profileDraft.useImperialHeight, forKey: AppStorageKey.useImperialForHeight)
        AppStorageKey.bumpProfileDataRevision()
    }

    func requestHealthKit() async {
        healthKitError = nil
        do {
            try await healthKitService.requestAuthorization()
        } catch {
            healthKitError = error.localizedDescription
        }
    }

    func testGeminiKey() async {
        let key: String
        do {
            guard let resolved = try APIKeyResolver.geminiKeyForValidation(preferredInput: geminiAPIKeyInput),
                  !resolved.isEmpty else {
                geminiTestState = .failure(String(localized: "settings.apiKeys.enterKeyToTest"))
                return
            }
            key = resolved
        } catch {
            geminiTestState = .failure(error.localizedDescription)
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
        case .profileSetup:
            return String(
                format: String(localized: "error.validation.ageRange"),
                AppConstants.Onboarding.minAgeYears,
                AppConstants.Onboarding.maxAgeYears
            )
        case .goalSetup:
            return String(localized: "error.validation.goalDateRange")
        default:
            return String(localized: "error.validation.requiredFields")
        }
    }
}
