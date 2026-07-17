import XCTest
@testable import CalSnap

final class UnitFormattersTests: XCTestCase {
    func testRawKgToLbsConversionIsNotStepAligned() {
        let rawLbs = UnitFormatters.kgToLbs(80)
        XCTAssertFalse(UnitFormatters.isValidStepperDisplayWeight(rawLbs, useLbs: true))
    }

    func testDisplayWeightSnapsLbsToWholeNumber() {
        let display = UnitFormatters.displayWeight(fromKg: 80, useLbs: true)
        XCTAssertEqual(display, 176)
        XCTAssertTrue(UnitFormatters.isValidStepperDisplayWeight(display, useLbs: true))
    }

    func testDisplayWeightSnapsKgToHalfStep() {
        let display = UnitFormatters.displayWeight(fromKg: 80.3, useLbs: false)
        XCTAssertEqual(display, 80.5, accuracy: 0.001)
        XCTAssertTrue(UnitFormatters.isValidStepperDisplayWeight(display, useLbs: false))
    }

    func testGoalWeightKgDefaultIsInvalidBeforeSyncWhenSwitchingToLbs() {
        let priorDisplay = 72.0
        XCTAssertFalse(UnitFormatters.weightDisplayRange(useLbs: true).contains(priorDisplay))
    }

    func testDisplayWeightKeepsGoalDefaultInsideLbsRange() {
        let display = UnitFormatters.displayWeight(fromKg: 72, useLbs: true)
        XCTAssertTrue(UnitFormatters.weightDisplayRange(useLbs: true).contains(display))
        XCTAssertTrue(UnitFormatters.isValidStepperDisplayWeight(display, useLbs: true))
    }

    func testKgFromDisplayWeightRoundTrip() {
        let lbsDisplay = UnitFormatters.displayWeight(fromKg: 80, useLbs: true)
        let kg = UnitFormatters.kgFromDisplayWeight(lbsDisplay, useLbs: true)
        XCTAssertEqual(kg, 80, accuracy: 0.2)
    }
}
