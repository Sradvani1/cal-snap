import Foundation

enum CalorieRingAccessibility {
    static func valueText(remaining: Int, target: Int) -> String {
        if remaining >= 0 {
            return "\(remaining) calories remaining of \(target) goal"
        }
        return "\(-remaining) calories over \(target) goal"
    }
}
