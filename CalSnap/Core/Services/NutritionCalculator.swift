import Foundation

struct NutritionCalculator {
    static func bmr(weightKg: Double, heightCm: Double, ageYears: Int, sex: BiologicalSex) -> Double {
        let base = (10 * weightKg) + (6.25 * heightCm) - (5 * Double(ageYears))
        return sex == .male ? base + 5 : base - 161
    }

    static func tdee(bmr: Double, activityLevel: ActivityLevel) -> Double {
        bmr * activityLevel.multiplier
    }

    static func dailyTarget(
        tdee: Double,
        requestedDeficit: Int,
        sex: BiologicalSex
    ) -> (target: Int, deficit: Int, warnings: [String]) {
        var warnings: [String] = []
        var deficit = requestedDeficit

        if deficit > AppConstants.Deficit.hardMaxDeficitKcal {
            deficit = AppConstants.Deficit.hardMaxDeficitKcal
            warnings.append("Deficit capped at \(AppConstants.Deficit.hardMaxDeficitKcal) kcal/day for safety.")
        }
        if deficit > AppConstants.Deficit.maxDeficitKcal {
            warnings.append("Deficits above \(AppConstants.Deficit.maxDeficitKcal) kcal/day can trigger metabolic adaptation. Recommend 350 kcal/day.")
        }

        let minimum = sex == .male
            ? AppConstants.Deficit.minCaloriesMale
            : AppConstants.Deficit.minCaloriesFemale
        let rawTarget = Int(tdee) - deficit
        let target = max(rawTarget, minimum)

        if rawTarget < minimum {
            warnings.append("Target floored to \(minimum) kcal/day minimum for safety.")
        }
        return (target, deficit, warnings)
    }

    static func macroTargets(
        dailyCalories: Int,
        proteinPct: Double,
        carbsPct: Double,
        fatPct: Double
    ) -> (proteinG: Double, carbsG: Double, fatG: Double) {
        let kcal = Double(dailyCalories)
        return (
            proteinG: (kcal * proteinPct) / AppConstants.Nutrition.proteinCalPerGram,
            carbsG: (kcal * carbsPct) / AppConstants.Nutrition.carbsCalPerGram,
            fatG: (kcal * fatPct) / AppConstants.Nutrition.fatCalPerGram
        )
    }

    static func bmi(weightKg: Double, heightCm: Double) -> Double {
        let heightM = heightCm / 100
        return weightKg / (heightM * heightM)
    }

    static func age(from dob: Date) -> Int {
        Calendar.current.dateComponents([.year], from: dob, to: Date()).year ?? 0
    }

    static func weightProjection(
        startWeightKg: Double,
        heightCm: Double,
        ageYears: Int,
        sex: BiologicalSex,
        activityLevel: ActivityLevel,
        dailyDeficitKcal: Int,
        weeks: Int
    ) -> [(week: Int, weightKg: Double)] {
        var results: [(Int, Double)] = [(0, startWeightKg)]
        var currentWeight = startWeightKg

        for week in 1...weeks {
            let currentBMR = bmr(
                weightKg: currentWeight,
                heightCm: heightCm,
                ageYears: ageYears,
                sex: sex
            )
            let currentTDEE = tdee(bmr: currentBMR, activityLevel: activityLevel)
            _ = currentTDEE // retained for PR6 dynamic deficit recalculation
            let weeklyDeficit = Double(dailyDeficitKcal) * 7.0
            let adaptationFactor = week > 4 ? 0.95 : 1.0
            let effectiveDeficit = weeklyDeficit * adaptationFactor
            let weightLossKg = effectiveDeficit / 7700.0
            currentWeight = max(currentWeight - weightLossKg, currentWeight * 0.7)
            results.append((week, currentWeight))
        }
        return results
    }

    static func isOnPlateau(weighIns: [WeighIn]) -> Bool {
        guard weighIns.count >= AppConstants.Plateau.weeksToDetect else { return false }
        let recent = weighIns.suffix(AppConstants.Plateau.weeksToDetect)
        let weights = recent.map(\.weightKg)
        let minWeight = weights.min() ?? 0
        let maxWeight = weights.max() ?? 0
        return (maxWeight - minWeight) < AppConstants.Plateau.weightChangeThresholdKg
    }
}
