import SwiftUI
import UIKit
import XCTest
@testable import CalSnap

final class DesignSystemTests: XCTestCase {
    func testCalorieRingAccessibilityValue() {
        let remainingExpected = String(
            format: String(localized: "designSystem.calorieRing.accessibility.remaining"),
            800,
            2000
        )
        let overExpected = String(
            format: String(localized: "designSystem.calorieRing.accessibility.over"),
            300,
            2000
        )
        XCTAssertEqual(CalorieRingAccessibility.valueText(remaining: 800, target: 2000), remainingExpected)
        XCTAssertEqual(CalorieRingAccessibility.valueText(remaining: -300, target: 2000), overExpected)
    }

    func testCalorieProgressColorBands() {
        XCTAssertEqual(CalorieProgressBand.progressBand(for: 0.89), .under)
        XCTAssertEqual(CalorieProgressBand.progressBand(for: 0.95), .onTrack)
        XCTAssertEqual(CalorieProgressBand.progressBand(for: 1.15), .over)

        XCTAssertEqual(Color.calorieProgress(0.89), Color.calorieProgress(for: .under))
        XCTAssertEqual(Color.calorieProgress(0.95), Color.calorieProgress(for: .onTrack))
        XCTAssertEqual(Color.calorieProgress(1.15), Color.calorieProgress(for: .over))
    }

    func testDesignSystemColorAssetsResolve() {
        for color in Color.allDesignSystemColors {
            let resolved = UIColor(color)
            XCTAssertNotNil(resolved.cgColor)
        }
    }
}
