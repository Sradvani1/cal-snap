import Foundation
import SwiftData

struct UserProfileRepository {
    func hasAnyProfile(context: ModelContext) throws -> Bool {
        let descriptor = FetchDescriptor<UserProfile>()
        return try !context.fetch(descriptor).isEmpty
    }

    func fetchAll(context: ModelContext) throws -> [UserProfile] {
        let descriptor = FetchDescriptor<UserProfile>(sortBy: [SortDescriptor(\.createdAt)])
        return try context.fetch(descriptor)
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
