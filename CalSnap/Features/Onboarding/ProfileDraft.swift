import Foundation

struct ProfileDraft: Equatable {
    var name: String = ""
    var sex: BiologicalSex = .male
    var dateOfBirth: Date = Calendar.current.date(byAdding: .year, value: -35, to: Date.now) ?? Date.now
    var heightCm: Double = 175
    var weightKg: Double = 80
    var goalWeightKg: Double = 72
    var goalTargetDate: Date = Calendar.current.date(byAdding: .month, value: 6, to: Date.now) ?? Date.now
    var activityLevel: ActivityLevel = .moderatelyActive
    var requestedDeficit: Int = AppConstants.Deficit.defaultDeficitKcal
    var useImperialHeight = false
    var useLbsWeight = false
    var useLbsGoalWeight = false

    var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    func isDateOfBirthValid() -> Bool {
        let age = NutritionCalculator.age(from: dateOfBirth)
        return age >= AppConstants.Onboarding.minAgeYears && age <= AppConstants.Onboarding.maxAgeYears
    }

    func isGoalTargetDateValid() -> Bool {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date.now)
        let target = calendar.startOfDay(for: goalTargetDate)
        guard let minDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.minGoalDaysFromToday, to: start),
              let maxDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.maxGoalDaysFromToday, to: start)
        else {
            return false
        }
        return target >= minDate && target <= maxDate
    }
}
