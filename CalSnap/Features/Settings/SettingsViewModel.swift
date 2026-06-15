import Foundation
import SwiftData
import SwiftUI

@MainActor
@Observable
final class SettingsViewModel {
    var profiles: [UserProfile] = []
    var activeProfile: UserProfile?
    var draft = ProfileDraft()
    var currentWeightKg: Double = 0
    var savedWeightKg: Double = 0

    var macroProteinPct = 28
    var macroCarbsPct = 47
    var macroFatPct = 25

    var previewTDEE = 0
    var previewTarget = 0
    var previewDeficit = 0
    var minimumCalories = 0

    var geminiAPIKeyInput = ""
    var usdaAPIKeyInput = ""
    var geminiTestState: GeminiTestState = .idle
    var geminiKeyConfigured = false
    var usdaKeyConfigured = false

    var healthKitWritesEnabled = true
    var healthKitWeightReadsEnabled = true
    var useLbsForWeight = AppStorageKey.useLbsForWeightValue
    var useImperialForHeight = false

    var reminderWeekday = AppConstants.Notifications.defaultReminderWeekday
    var reminderHour = AppConstants.Notifications.defaultReminderHour
    var reminderMinute = AppConstants.Notifications.defaultReminderMinute

    var loadError: String?
    var saveError: String?
    var apiKeyError: String?
    var syncMessage: String?
    var isSaving = false
    var isSyncing = false
    var exportURL: URL?

    private let userProfileRepository: UserProfileRepository
    private let mealRepository: MealRepository
    private let weighInRepository: WeighInRepository
    private let healthKitService: HealthKitService
    private let geminiService: GeminiService
    private let notificationManager: NotificationManager

    init(
        userProfileRepository: UserProfileRepository,
        mealRepository: MealRepository,
        weighInRepository: WeighInRepository,
        healthKitService: HealthKitService,
        geminiService: GeminiService,
        notificationManager: NotificationManager
    ) {
        self.userProfileRepository = userProfileRepository
        self.mealRepository = mealRepository
        self.weighInRepository = weighInRepository
        self.healthKitService = healthKitService
        self.geminiService = geminiService
        self.notificationManager = notificationManager
    }

    var hasSecondProfile: Bool {
        profiles.count > 1
    }

    var partnerProfile: UserProfile? {
        guard let activeProfile else { return nil }
        return profiles.first { $0.id != activeProfile.id }
    }

    var macrosAreValid: Bool {
        ProfileUpdateService.macroPercentsAreValid(
            protein: macroProteinPct,
            carbs: macroCarbsPct,
            fat: macroFatPct
        )
    }

    var canSaveProfile: Bool {
        !draft.trimmedName.isEmpty
            && draft.isDateOfBirthValid()
            && draft.isGoalTargetDateValid()
            && macrosAreValid
            && !isSaving
    }

    var profileValidationMessage: String? {
        if draft.trimmedName.isEmpty {
            return "Enter a name to save."
        }
        if !draft.isDateOfBirthValid() {
            return "Age must be between \(AppConstants.Onboarding.minAgeYears) and \(AppConstants.Onboarding.maxAgeYears)."
        }
        if !draft.isGoalTargetDateValid() {
            return "Goal date must be 2 weeks to 2 years from today."
        }
        if !macrosAreValid {
            return "Macro targets must sum to 100%."
        }
        return nil
    }

    func load(context: ModelContext, activeUserId: String) {
        loadError = nil
        do {
            profiles = try userProfileRepository.fetchAll(context: context)
            activeProfile = resolveActiveProfile(from: profiles, activeUserId: activeUserId)
            guard let profile = activeProfile else { return }

            draft = profileDraft(from: profile)
            macroProteinPct = Int((profile.macroTargetProteinPct * 100).rounded())
            macroCarbsPct = Int((profile.macroTargetCarbsPct * 100).rounded())
            macroFatPct = Int((profile.macroTargetFatPct * 100).rounded())
            let normalized = ProfileUpdateService.normalizedMacroPercents(
                protein: macroProteinPct,
                carbs: macroCarbsPct,
                fat: macroFatPct
            )
            macroProteinPct = normalized.0
            macroCarbsPct = normalized.1
            macroFatPct = normalized.2

            let latest = try weighInRepository.fetchLatestWeighIns(
                for: profile.id,
                count: 1,
                context: context
            ).last?.weightKg ?? profile.startingWeightKg
            currentWeightKg = latest
            savedWeightKg = latest

            refreshPreview()
            loadAPIKeyStatus()
            loadPreferences()
            loadReminderSchedule(for: profile.id)
        } catch {
            loadError = error.localizedDescription
        }
    }

    func refreshPreview() {
        guard let profile = activeProfile else { return }
        let result = ProfileUpdateService.preview(
            sex: draft.sex,
            dateOfBirth: draft.dateOfBirth,
            heightCm: draft.heightCm,
            weightKg: currentWeightKg,
            activityLevel: draft.activityLevel,
            deficitKcal: profile.deficitKcal
        )
        previewTDEE = result.tdee
        previewTarget = result.dailyTarget
        previewDeficit = result.deficitKcal
        minimumCalories = result.minimumCalories
    }

    func updateDraft(_ update: (inout ProfileDraft) -> Void) {
        update(&draft)
        refreshPreview()
    }

    func adjustMacro(changed: MacroKind, newValue: Int) {
        let adjusted = ProfileUpdateService.adjustMacroPercents(
            changed: changed,
            newValue: newValue,
            protein: macroProteinPct,
            carbs: macroCarbsPct,
            fat: macroFatPct
        )
        macroProteinPct = adjusted.0
        macroCarbsPct = adjusted.1
        macroFatPct = adjusted.2
    }

    func saveProfile(context: ModelContext) async {
        guard let profile = activeProfile else { return }
        guard canSaveProfile else {
            saveError = profileValidationMessage
            return
        }

        isSaving = true
        saveError = nil
        defer { isSaving = false }

        do {
            let weightChanged = abs(currentWeightKg - savedWeightKg) >= 0.05
            ProfileUpdateService.apply(to: profile, draft: draft, weightKg: currentWeightKg)
            ProfileUpdateService.applyMacroTargets(
                to: profile,
                proteinPct: macroProteinPct,
                carbsPct: macroCarbsPct,
                fatPct: macroFatPct
            )

            if weightChanged {
                _ = try WeighInService.save(
                    profile: profile,
                    newWeightKg: currentWeightKg,
                    date: Date.now,
                    weighInRepository: weighInRepository,
                    healthKitService: healthKitService,
                    context: context
                )
                savedWeightKg = currentWeightKg
            } else {
                try context.save()
            }

            refreshPreview()
            AppStorageKey.bumpProfileDataRevision()
        } catch {
            saveError = error.localizedDescription
        }
    }

    func saveGeminiAPIKey() throws {
        apiKeyError = nil
        let gemini = geminiAPIKeyInput.trimmingCharacters(in: .whitespacesAndNewlines)
        if gemini.isEmpty {
            if geminiKeyConfigured {
                KeychainManager.delete(for: .geminiAPIKey)
            }
        } else {
            try KeychainManager.save(gemini, for: .geminiAPIKey)
        }
        geminiAPIKeyInput = ""
        loadAPIKeyStatus()
    }

    func saveUSDAAPIKey() throws {
        apiKeyError = nil
        let usda = usdaAPIKeyInput.trimmingCharacters(in: .whitespacesAndNewlines)
        if usda.isEmpty {
            if usdaKeyConfigured {
                KeychainManager.delete(for: .usdaAPIKey)
            }
        } else {
            try KeychainManager.save(usda, for: .usdaAPIKey)
        }
        usdaAPIKeyInput = ""
        loadAPIKeyStatus()
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

    func persistHealthKitPreferences() {
        UserDefaults.standard.set(healthKitWritesEnabled, forKey: AppStorageKey.healthKitWritesEnabled)
        UserDefaults.standard.set(healthKitWeightReadsEnabled, forKey: AppStorageKey.healthKitWeightReadsEnabled)
    }

    func persistUnitPreferences() {
        UserDefaults.standard.set(useLbsForWeight, forKey: AppStorageKey.useLbsForWeight)
        UserDefaults.standard.set(useImperialForHeight, forKey: AppStorageKey.useImperialForHeight)
        AppStorageKey.bumpProfileDataRevision()
    }

    func updateReminderSchedule(context: ModelContext) async {
        guard let profile = activeProfile else { return }
        notificationManager.setReminderSchedule(
            userId: profile.id,
            weekday: reminderWeekday,
            hour: reminderHour,
            minute: reminderMinute
        )
        await notificationManager.scheduleWeighInReminder(userId: profile.id, name: profile.name)
    }

    func syncHealthKitWeight(context: ModelContext) async {
        guard let profile = activeProfile else { return }
        guard healthKitWeightReadsEnabled else {
            syncMessage = "Enable weight reads to sync from Health."
            return
        }

        isSyncing = true
        syncMessage = nil
        defer { isSyncing = false }

        do {
            try await healthKitService.requestAuthorization()
            guard let hkWeight = try await healthKitService.fetchLatestWeight() else {
                syncMessage = "No weight found in Health."
                return
            }

            let latestLocal = try weighInRepository.fetchLatestWeighIns(
                for: profile.id,
                count: 1,
                context: context
            ).last?.weightKg ?? profile.startingWeightKg

            guard abs(hkWeight - latestLocal) >= 0.1 else {
                syncMessage = "Weight is already up to date."
                return
            }

            _ = try WeighInService.save(
                profile: profile,
                newWeightKg: hkWeight,
                date: Date.now,
                weighInRepository: weighInRepository,
                healthKitService: healthKitService,
                context: context
            )
            currentWeightKg = hkWeight
            savedWeightKg = hkWeight
            refreshPreview()
            syncMessage = "Imported \(UnitFormatters.formatWeight(kg: hkWeight, useLbs: useLbsForWeight)) from Health."
            AppStorageKey.bumpProfileDataRevision()
        } catch {
            syncMessage = error.localizedDescription
        }
    }

    func makeExportURL(context: ModelContext) throws -> URL {
        guard let profile = activeProfile else {
            throw SettingsError.noActiveProfile
        }

        let meals = try mealRepository.fetchAll(for: profile.id, context: context)
        let weighIns = try weighInRepository.fetchAll(for: profile.id, sortDescending: false, context: context)
        let csv = DataExportService.makeCSV(meals: meals, weighIns: weighIns)

        let safeName = profile.name
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
            .joined(separator: "-")
        let slug = safeName.isEmpty ? "export" : safeName
        let fileName = "calsnap-\(slug)-export.csv"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        try csv.write(to: url, atomically: true, encoding: .utf8)
        exportURL = url
        return url
    }

    func deleteActiveUserData(context: ModelContext) throws {
        guard let profile = activeProfile else { return }
        try UserDataDeletionService.deleteUserData(
            userId: profile.id,
            userProfileRepository: userProfileRepository,
            notificationManager: notificationManager,
            context: context
        )
        AppStorageKey.bumpProfileDataRevision()
    }

    func deleteAllUserData(context: ModelContext) throws {
        try UserDataDeletionService.deleteAllUserData(
            userProfileRepository: userProfileRepository,
            notificationManager: notificationManager,
            context: context
        )
        AppStorageKey.bumpProfileDataRevision()
    }

    func deletePartnerData(context: ModelContext, partnerId: UUID) throws {
        try UserDataDeletionService.deleteUserData(
            userId: partnerId,
            userProfileRepository: userProfileRepository,
            notificationManager: notificationManager,
            context: context
        )
        AppStorageKey.bumpProfileDataRevision()
    }

    private func loadAPIKeyStatus() {
        geminiKeyConfigured = (try? APIKeyResolver.resolvedGeminiAPIKey())?.isEmpty == false
        if let stored = try? KeychainManager.load(for: .usdaAPIKey), !stored.isEmpty {
            usdaKeyConfigured = true
        } else {
            usdaKeyConfigured = false
        }
    }

    private func loadPreferences() {
        healthKitWritesEnabled = AppStorageKey.healthKitWritesEnabledValue
        healthKitWeightReadsEnabled = AppStorageKey.healthKitWeightReadsEnabledValue
        useLbsForWeight = AppStorageKey.useLbsForWeightValue
        useImperialForHeight = UserDefaults.standard.object(forKey: AppStorageKey.useImperialForHeight) as? Bool ?? false
    }

    private func loadReminderSchedule(for userId: UUID) {
        reminderWeekday = notificationManager.reminderWeekday(for: userId)
        reminderHour = notificationManager.reminderHour(for: userId)
        reminderMinute = notificationManager.reminderMinute(for: userId)
    }

    private func profileDraft(from profile: UserProfile) -> ProfileDraft {
        var draft = ProfileDraft()
        draft.name = profile.name
        draft.sex = profile.sex
        draft.dateOfBirth = profile.dateOfBirth
        draft.heightCm = profile.heightCm
        draft.goalWeightKg = profile.goalWeightKg
        draft.goalTargetDate = profile.goalTargetDate
        draft.activityLevel = profile.activityLevel
        draft.requestedDeficit = profile.deficitKcal
        draft.useLbsWeight = useLbsForWeight
        draft.useLbsGoalWeight = useLbsForWeight
        draft.useImperialHeight = useImperialForHeight
        return draft
    }

    private func resolveActiveProfile(from profiles: [UserProfile], activeUserId: String) -> UserProfile? {
        if let id = UUID(uuidString: activeUserId),
           let match = profiles.first(where: { $0.id == id }) {
            return match
        }
        return profiles.first
    }
}

enum SettingsError: Error {
    case noActiveProfile
}
