import Foundation

enum UnitFormatters {
    static let lbsPerKg = 2.2046226218
    static let cmPerInch = 2.54
    static let weightRangeLbs: ClosedRange<Double> = 80...400
    static let weightRangeKg: ClosedRange<Double> = 35...180

    static func kgToLbs(_ kg: Double) -> Double {
        kg * lbsPerKg
    }

    static func lbsToKg(_ lbs: Double) -> Double {
        lbs / lbsPerKg
    }

    static func weightDisplayRange(useLbs: Bool) -> ClosedRange<Double> {
        useLbs ? weightRangeLbs : weightRangeKg
    }

    static func weightDisplayStep(useLbs: Bool) -> Double {
        useLbs ? 1 : 0.5
    }

    /// Snaps a Stepper display value to a valid step inside the unit range.
    static func snappedDisplayWeight(_ value: Double, useLbs: Bool) -> Double {
        let range = weightDisplayRange(useLbs: useLbs)
        let clamped = min(max(value, range.lowerBound), range.upperBound)
        if useLbs {
            return clamped.rounded(.toNearestOrAwayFromZero)
        }
        return (clamped * 2).rounded(.toNearestOrAwayFromZero) / 2
    }

    static func displayWeight(fromKg kg: Double, useLbs: Bool) -> Double {
        snappedDisplayWeight(useLbs ? kgToLbs(kg) : kg, useLbs: useLbs)
    }

    /// One-decimal display for free-form weight inputs (e.g. weigh-in TextField).
    static func preciseDisplayWeight(fromKg kg: Double, useLbs: Bool) -> Double {
        let raw = useLbs ? kgToLbs(kg) : kg
        return (raw * 10).rounded(.toNearestOrAwayFromZero) / 10
    }

    static func kgFromDisplayWeight(_ display: Double, useLbs: Bool) -> Double {
        useLbs ? lbsToKg(display) : display
    }

    static func kgFromPreciseDisplayWeight(_ display: Double, useLbs: Bool) -> Double {
        useLbs ? lbsToKg(display) : display
    }

    static func isValidStepperDisplayWeight(_ value: Double, useLbs: Bool) -> Bool {
        let range = weightDisplayRange(useLbs: useLbs)
        guard value >= range.lowerBound && value <= range.upperBound else { return false }
        let step = weightDisplayStep(useLbs: useLbs)
        let offset = value - range.lowerBound
        return abs(offset.truncatingRemainder(dividingBy: step)) < 0.001
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
            let formatted = kgToLbs(kg).formatted(.number.precision(.fractionLength(1)))
            return String(format: String(localized: "units.weight.lbsFormat"), formatted)
        }
        let formatted = kg.formatted(.number.precision(.fractionLength(1)))
        return String(format: String(localized: "units.weight.kgFormat"), formatted)
    }

    static func formatHeight(cm: Double, useImperial: Bool) -> String {
        if useImperial {
            let parts = cmToFeetInches(cm)
            return String(format: String(localized: "units.height.imperialFormat"), parts.feet, parts.inches)
        }
        let formatted = cm.formatted(.number.precision(.fractionLength(0)))
        return String(format: String(localized: "units.height.metricFormat"), formatted)
    }

    static func stepperWeightLabel(displayValue: Double, useLbs: Bool) -> String {
        if useLbs {
            let formatted = displayValue.formatted(.number.precision(.fractionLength(0)))
            return String(format: String(localized: "units.stepper.weightLbs"), formatted)
        }
        let formatted = displayValue.formatted(.number.precision(.fractionLength(1)))
        return String(format: String(localized: "units.stepper.weightKg"), formatted)
    }

    static func stepperGoalWeightLabel(displayValue: Double, useLbs: Bool) -> String {
        if useLbs {
            let formatted = displayValue.formatted(.number.precision(.fractionLength(0)))
            return String(format: String(localized: "units.stepper.goalWeightLbs"), formatted)
        }
        let formatted = displayValue.formatted(.number.precision(.fractionLength(1)))
        return String(format: String(localized: "units.stepper.goalWeightKg"), formatted)
    }

    static func formatMacroGrams(_ grams: Double, fractionLength: Int) -> String {
        let formatted = grams.formatted(.number.precision(.fractionLength(fractionLength)))
        return String(format: String(localized: "units.macro.gramsFormat"), formatted)
    }
}
