import XCTest
@testable import CalSnap

final class MealTypeTests: XCTestCase {
    func testSuggestedBreakfast() {
        XCTAssertEqual(MealType.suggested(for: date(hour: 10)), .breakfast)
    }

    func testSuggestedLunch() {
        XCTAssertEqual(MealType.suggested(for: date(hour: 11)), .lunch)
    }

    func testSuggestedSnack() {
        XCTAssertEqual(MealType.suggested(for: date(hour: 17)), .snack)
    }

    func testSuggestedDinner() {
        XCTAssertEqual(MealType.suggested(for: date(hour: 18)), .dinner)
    }

    private func date(hour: Int) -> Date {
        var components = DateComponents()
        components.year = 2026
        components.month = 6
        components.day = 14
        components.hour = hour
        return Calendar.current.date(from: components)!
    }
}
