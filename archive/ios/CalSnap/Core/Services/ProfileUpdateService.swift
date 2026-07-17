import Foundation

enum MacroKind: Hashable {
    case protein
    case carbs
    case fat
}

enum ProfileUpdateService {
    struct PreviewResult: Equatable {
        let tdee: Int
        let dailyTarget: Int
        let deficitKcal: Int
        let minimumCalories: Int
    }

    static func preview(
        sex: BiologicalSex,
        dateOfBirth: Date,
        heightCm: Double,
        weightKg: Double,
        activityLevel: ActivityLevel,
        deficitKcal: Int
    ) -> PreviewResult {
        let age = NutritionCalculator.age(from: dateOfBirth)
        let bmr = NutritionCalculator.bmr(
            weightKg: weightKg,
            heightCm: heightCm,
            ageYears: age,
            sex: sex
        )
        let tdeeValue = NutritionCalculator.tdee(bmr: bmr, activityLevel: activityLevel)
        let targetResult = NutritionCalculator.dailyTarget(
            tdee: tdeeValue,
            requestedDeficit: deficitKcal,
            sex: sex
        )
        let minimum = switch sex {
        case .male: AppConstants.Deficit.minCaloriesMale
        case .female: AppConstants.Deficit.minCaloriesFemale
        }
        return PreviewResult(
            tdee: Int(tdeeValue.rounded()),
            dailyTarget: targetResult.target,
            deficitKcal: targetResult.deficit,
            minimumCalories: minimum
        )
    }

    static func apply(
        to profile: UserProfile,
        draft: ProfileDraft,
        weightKg: Double
    ) {
        let result = preview(
            sex: draft.sex,
            dateOfBirth: draft.dateOfBirth,
            heightCm: draft.heightCm,
            weightKg: weightKg,
            activityLevel: draft.activityLevel,
            deficitKcal: profile.deficitKcal
        )

        profile.name = draft.trimmedName
        profile.sex = draft.sex
        profile.dateOfBirth = draft.dateOfBirth
        profile.heightCm = draft.heightCm
        profile.goalWeightKg = draft.goalWeightKg
        profile.goalTargetDate = draft.goalTargetDate
        profile.activityLevel = draft.activityLevel
        profile.tdee = result.tdee
        profile.dailyCalorieTarget = result.dailyTarget
        profile.deficitKcal = result.deficitKcal
        profile.updatedAt = Date.now
    }

    static func applyMacroTargets(
        to profile: UserProfile,
        proteinPct: Int,
        carbsPct: Int,
        fatPct: Int
    ) {
        profile.macroTargetProteinPct = Double(proteinPct) / 100.0
        profile.macroTargetCarbsPct = Double(carbsPct) / 100.0
        profile.macroTargetFatPct = Double(fatPct) / 100.0
        profile.updatedAt = Date.now
    }

    static func macroPercentsAreValid(protein: Int, carbs: Int, fat: Int) -> Bool {
        protein >= 0 && carbs >= 0 && fat >= 0 && protein + carbs + fat == 100
    }

    static func normalizedMacroPercents(protein: Int, carbs: Int, fat: Int) -> (Int, Int, Int) {
        if macroPercentsAreValid(protein: protein, carbs: carbs, fat: fat) {
            return (protein, carbs, fat)
        }
        let sum = protein + carbs + fat
        guard sum > 0 else {
            return (
                Int((AppConstants.Nutrition.defaultMacroProteinPct * 100).rounded()),
                Int((AppConstants.Nutrition.defaultMacroCarbsPct * 100).rounded()),
                Int((AppConstants.Nutrition.defaultMacroFatPct * 100).rounded())
            )
        }
        var p = Int((Double(protein) / Double(sum) * 100).rounded())
        let c = Int((Double(carbs) / Double(sum) * 100).rounded())
        let f = 100 - p - c
        return (max(0, p), max(0, c), max(0, f))
    }

    static func adjustMacroPercents(
        changed: MacroKind,
        newValue: Int,
        protein: Int,
        carbs: Int,
        fat: Int
    ) -> (Int, Int, Int) {
        let clamped = min(max(newValue, 0), 100)
        var p = protein
        var c = carbs
        var f = fat

        switch changed {
        case .protein:
            p = clamped
            let remaining = 100 - p
            let otherSum = carbs + fat
            if otherSum == 0 {
                c = remaining / 2
                f = remaining - c
            } else {
                c = Int((Double(remaining) * Double(carbs) / Double(otherSum)).rounded())
                f = remaining - c
            }
        case .carbs:
            c = clamped
            let remaining = 100 - c
            let otherSum = protein + fat
            if otherSum == 0 {
                p = remaining / 2
                f = remaining - p
            } else {
                p = Int((Double(remaining) * Double(protein) / Double(otherSum)).rounded())
                f = remaining - p
            }
        case .fat:
            f = clamped
            let remaining = 100 - f
            let otherSum = protein + carbs
            if otherSum == 0 {
                p = remaining / 2
                c = remaining - p
            } else {
                p = Int((Double(remaining) * Double(protein) / Double(otherSum)).rounded())
                c = remaining - p
            }
        }

        return (p, c, f)
    }
}
