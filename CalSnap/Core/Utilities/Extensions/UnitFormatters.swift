import Foundation

enum UnitFormatters {
    static let lbsPerKg = 2.2046226218
    static let cmPerInch = 2.54

    static func kgToLbs(_ kg: Double) -> Double {
        kg * lbsPerKg
    }

    static func lbsToKg(_ lbs: Double) -> Double {
        lbs / lbsPerKg
    }

    static func cmToFeetInches(_ cm: Double) -> (feet: Int, inches: Int) {
        let totalInches = cm / cmPerInch
        let feet = Int(totalInches / 12)
        let inches = Int(totalInches.rounded()) - feet * 12
        return (feet, max(0, min(inches, 11)))
    }

    static func feetInchesToCm(feet: Int, inches: Int) -> Double {
        Double(feet * 12 + inches) * cmPerInch
    }

    static func formatWeight(kg: Double, useLbs: Bool) -> String {
        if useLbs {
            return kgToLbs(kg).formatted(.number.precision(.fractionLength(1))) + " lbs"
        }
        return kg.formatted(.number.precision(.fractionLength(1))) + " kg"
    }

    static func formatHeight(cm: Double, useImperial: Bool) -> String {
        if useImperial {
            let parts = cmToFeetInches(cm)
            return "\(parts.feet) ft \(parts.inches) in"
        }
        return cm.formatted(.number.precision(.fractionLength(0))) + " cm"
    }

    static func stepperWeightLabel(displayValue: Double, useLbs: Bool) -> String {
        if useLbs {
            let formatted = displayValue.formatted(.number.precision(.fractionLength(0)))
            return "Weight: \(formatted) lbs"
        }
        let formatted = displayValue.formatted(.number.precision(.fractionLength(1)))
        return "Weight: \(formatted) kg"
    }

    static func stepperGoalWeightLabel(displayValue: Double, useLbs: Bool) -> String {
        if useLbs {
            let formatted = displayValue.formatted(.number.precision(.fractionLength(0)))
            return "Goal weight: \(formatted) lbs"
        }
        let formatted = displayValue.formatted(.number.precision(.fractionLength(1)))
        return "Goal weight: \(formatted) kg"
    }

    static func formatMacroGrams(_ grams: Double, fractionLength: Int) -> String {
        grams.formatted(.number.precision(.fractionLength(fractionLength))) + " g"
    }
}
