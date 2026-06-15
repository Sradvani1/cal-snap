import Foundation
import SwiftData

@MainActor
@Observable
final class WeighInViewModel {
    var weightInput: Double = 0
    var useLbs: Bool
    var selectedDate = Date.now
    var isSaving = false
    var saveError: String?

    private(set) var previewTDEE: Int = 0
    private(set) var previewDailyTarget: Int = 0

    private let profile: UserProfile
    private let weighInRepository: WeighInRepository
    private let healthKitService: HealthKitService

    init(
        profile: UserProfile,
        currentWeightKg: Double,
        useLbs: Bool,
        weighInRepository: WeighInRepository,
        healthKitService: HealthKitService
    ) {
        self.profile = profile
        self.useLbs = useLbs
        self.weighInRepository = weighInRepository
        self.healthKitService = healthKitService
        self.weightInput = useLbs ? UnitFormatters.kgToLbs(currentWeightKg) : currentWeightKg
        refreshPreview()
    }

    var weightKg: Double {
        useLbs ? UnitFormatters.lbsToKg(weightInput) : weightInput
    }

    var previousTDEE: Int {
        profile.tdee
    }

    var previousDailyTarget: Int {
        profile.dailyCalorieTarget
    }

    var canSave: Bool {
        weightKg > 0 && !isSaving
    }

    var userId: UUID {
        profile.id
    }

    var targetsAccessibilitySummary: String {
        "TDEE updates from \(previousTDEE) to \(previewTDEE) calories per day. Daily target updates from \(previousDailyTarget) to \(previewDailyTarget) calories per day."
    }

    func setUseLbs(_ newValue: Bool) {
        guard newValue != useLbs else { return }
        let kg = weightKg
        useLbs = newValue
        weightInput = newValue ? UnitFormatters.kgToLbs(kg) : kg
        refreshPreview()
    }

    func weightInputDidChange() {
        refreshPreview()
    }

    func refreshPreview() {
        let recalculation = WeighInService.recalculate(profile: profile, newWeightKg: weightKg)
        previewTDEE = recalculation.tdee
        previewDailyTarget = recalculation.dailyTarget
    }

    func save(context: ModelContext) throws -> WeighInService.SaveResult {
        guard canSave else {
            throw WeighInViewModelError.invalidWeight
        }

        isSaving = true
        saveError = nil
        defer { isSaving = false }

        do {
            return try WeighInService.save(
                profile: profile,
                newWeightKg: weightKg,
                date: selectedDate,
                weighInRepository: weighInRepository,
                healthKitService: healthKitService,
                context: context
            )
        } catch {
            saveError = error.localizedDescription
            throw error
        }
    }
}

enum WeighInViewModelError: Error, LocalizedError {
    case invalidWeight

    var errorDescription: String? {
        switch self {
        case .invalidWeight:
            return "Enter a valid weight to continue."
        }
    }
}
