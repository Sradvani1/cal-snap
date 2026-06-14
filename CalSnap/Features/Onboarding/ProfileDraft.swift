import Foundation

struct ProfileDraft: Equatable {
    var name: String = ""
    var sex: BiologicalSex = .male
    var dateOfBirth: Date = Calendar.current.date(byAdding: .year, value: -35, to: Date()) ?? Date()
    var heightCm: Double = 175
    var weightKg: Double = 80
    var goalWeightKg: Double = 72
    var goalTargetDate: Date = Calendar.current.date(byAdding: .month, value: 6, to: Date()) ?? Date()
    var activityLevel: ActivityLevel = .moderatelyActive
    var requestedDeficit: Int = AppConstants.Deficit.defaultDeficitKcal

    var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
