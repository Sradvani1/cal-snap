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

        let minimum = switch sex {
        case .male: AppConstants.Deficit.minCaloriesMale
        case .female: AppConstants.Deficit.minCaloriesFemale
        }
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
        Calendar.current.dateComponents([.year], from: dob, to: Date.now).year ?? 0
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
        let recent = weighIns
            .sorted { $0.date < $1.date }
            .suffix(AppConstants.Plateau.weeksToDetect)
        guard let minWeight = recent.map(\.weightKg).min(),
              let maxWeight = recent.map(\.weightKg).max() else { return false }
        return (maxWeight - minWeight) < AppConstants.Plateau.weightChangeThresholdKg
    }

    static func weeklyLossRateKg(from weighIns: [WeighIn]) -> Double? {
        guard weighIns.count >= 2 else { return nil }
        let sorted = weighIns.sorted { $0.date < $1.date }
        let recent = Array(sorted.suffix(4))
        guard let first = recent.first, let last = recent.last, recent.count >= 2 else {
            return nil
        }
        let days = Calendar.current.dateComponents([.day], from: first.date, to: last.date).day ?? 0
        guard days > 0 else { return nil }
        let lossKg = first.weightKg - last.weightKg
        return (lossKg / Double(days)) * 7.0
    }

    static func projectedGoalDate(
        currentWeightKg: Double,
        goalWeightKg: Double,
        heightCm: Double,
        ageYears: Int,
        sex: BiologicalSex,
        activityLevel: ActivityLevel,
        dailyDeficitKcal: Int,
        referenceDate: Date = Date.now,
        calendar: Calendar = .current
    ) -> Date? {
        guard dailyDeficitKcal > 0, currentWeightKg > goalWeightKg else { return nil }

        let projection = weightProjection(
            startWeightKg: currentWeightKg,
            heightCm: heightCm,
            ageYears: ageYears,
            sex: sex,
            activityLevel: activityLevel,
            dailyDeficitKcal: dailyDeficitKcal,
            weeks: AppConstants.Notifications.maxProjectionWeeks
        )

        guard let goalWeek = projection.first(where: { $0.weightKg <= goalWeightKg })?.week else {
            return nil
        }

        return calendar.date(byAdding: .weekOfYear, value: goalWeek, to: referenceDate)
    }

    static func projectionPoints(
        startWeightKg: Double,
        goalWeightKg: Double,
        heightCm: Double,
        ageYears: Int,
        sex: BiologicalSex,
        activityLevel: ActivityLevel,
        dailyDeficitKcal: Int,
        startDate: Date = Date.now,
        calendar: Calendar = .current
    ) -> [(date: Date, weightKg: Double)] {
        guard dailyDeficitKcal > 0 else { return [] }

        let projection = weightProjection(
            startWeightKg: startWeightKg,
            heightCm: heightCm,
            ageYears: ageYears,
            sex: sex,
            activityLevel: activityLevel,
            dailyDeficitKcal: dailyDeficitKcal,
            weeks: AppConstants.Notifications.maxProjectionWeeks
        )

        var points: [(Date, Double)] = []
        for (week, weightKg) in projection {
            guard let date = calendar.date(byAdding: .weekOfYear, value: week, to: startDate) else {
                continue
            }
            points.append((date, weightKg))
            if weightKg <= goalWeightKg { break }
        }
        return points
    }
}
