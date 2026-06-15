import Foundation

enum CalorieRingAccessibility {
    static func valueText(remaining: Int, target: Int) -> String {
        if remaining >= 0 {
            return String(
                format: String(localized: "designSystem.calorieRing.accessibility.remaining"),
                remaining,
                target
            )
        }
        return String(
            format: String(localized: "designSystem.calorieRing.accessibility.over"),
            -remaining,
            target
        )
    }
}
