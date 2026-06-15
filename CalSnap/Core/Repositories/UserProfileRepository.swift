import Foundation
import SwiftData

/// Local profile persistence. CalSnap is single-user per install; when legacy data
/// contains multiple profiles, `fetchPrimaryProfile` returns the earliest `createdAt`.
struct UserProfileRepository {
    private static let profileSort: [SortDescriptor<UserProfile>] = [
        SortDescriptor(\.createdAt, order: .forward)
    ]

    func hasAnyProfile(context: ModelContext) throws -> Bool {
        let descriptor = FetchDescriptor<UserProfile>()
        return try !context.fetch(descriptor).isEmpty
    }

    func fetchAll(context: ModelContext) throws -> [UserProfile] {
        let descriptor = FetchDescriptor<UserProfile>(sortBy: Self.profileSort)
        return try context.fetch(descriptor)
    }

    /// Returns the single canonical local profile: earliest `createdAt` wins.
    /// Multiple profiles are legacy/debug data only; callers must not expose switching UI.
    func fetchPrimaryProfile(context: ModelContext) throws -> UserProfile? {
        var descriptor = FetchDescriptor<UserProfile>(sortBy: Self.profileSort)
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
    }

    func save(_ profiles: [UserProfile], context: ModelContext) throws {
        profiles.forEach { context.insert($0) }
        try context.save()
    }

    func makeUserProfile(from draft: ProfileDraft) -> UserProfile {
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

        return UserProfile(
            name: draft.trimmedName,
            sex: draft.sex,
            dateOfBirth: draft.dateOfBirth,
            heightCm: draft.heightCm,
            startingWeightKg: draft.weightKg,
            goalWeightKg: draft.goalWeightKg,
            goalTargetDate: draft.goalTargetDate,
            activityLevel: draft.activityLevel,
            dailyCalorieTarget: targetResult.target,
            tdee: Int(tdeeValue.rounded()),
            deficitKcal: targetResult.deficit
        )
    }
}
