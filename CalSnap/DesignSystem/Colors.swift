import SwiftUI

extension Color {
    static let csPrimary = Color("Primary")
    static let csSecondary = Color("Secondary")
    static let csAccent = Color("Accent")
    static let csBackground = Color("Background")
    static let csSurface = Color("Surface")
    static let csSuccess = Color("Success")
    static let csWarning = Color("Warning")
    static let csDanger = Color("Danger")
    static let csProtein = Color("Protein")
    static let csCarbs = Color("Carbs")
    static let csFat = Color("Fat")
    static let csOnPrimary = Color("OnPrimary")

    static func calorieProgress(_ ratio: Double) -> Color {
        calorieProgress(for: CalorieProgressBand.progressBand(for: ratio))
    }

    static func calorieProgress(for band: CalorieProgressBand) -> Color {
        switch band {
        case .under: Color.csSuccess
        case .onTrack: Color.csWarning
        case .over: Color.csDanger
        }
    }

    static func fiberProgress(for band: FiberProgressBand) -> Color {
        switch band {
        case .onTrack: Color.csSuccess
        case .moderate: Color.csWarning
        case .low: Color.csDanger
        }
    }

    /// All design-token colors — used by asset-resolution tests.
    static let allDesignSystemColors: [Color] = [
        .csPrimary, .csSecondary, .csAccent, .csBackground, .csSurface,
        .csSuccess, .csWarning, .csDanger, .csProtein, .csCarbs, .csFat, .csOnPrimary,
    ]
}
