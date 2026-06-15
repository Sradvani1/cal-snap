import Foundation
import SwiftData

@Observable
@MainActor
final class WeighInViewModel {
    var weightInput: Double = 0
    var useLbs: Bool
    var selectedDate = Date()
    var isSaving = false
    var saveError: String?

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

    var previewRecalculation: WeighInService.RecalculationResult {
        WeighInService.recalculate(profile: profile, newWeightKg: weightKg)
    }

    var previewTDEE: Int {
        previewRecalculation.tdee
    }

    var previewDailyTarget: Int {
        previewRecalculation.dailyTarget
    }

    var canSave: Bool {
        weightKg > 0 && !isSaving
    }

    var userId: UUID {
        profile.id
    }

    func setUseLbs(_ newValue: Bool) {
        guard newValue != useLbs else { return }
        let kg = weightKg
        useLbs = newValue
        weightInput = newValue ? UnitFormatters.kgToLbs(kg) : kg
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
