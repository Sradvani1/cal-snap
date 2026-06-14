import Foundation

extension UserProfile {
    var displayWeightLbs: Double {
        UnitFormatters.kgToLbs(startingWeightKg)
    }

    var displayGoalWeightLbs: Double {
        UnitFormatters.kgToLbs(goalWeightKg)
    }

    var displayHeightFeetInches: (feet: Int, inches: Int) {
        UnitFormatters.cmToFeetInches(heightCm)
    }
}
