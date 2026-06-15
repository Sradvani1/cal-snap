import XCTest
@testable import CalSnap

final class WidgetDataStoreTests: XCTestCase {
    func testWidgetDataCodableRoundTrip() throws {
        let data = WidgetData(
            displayName: "Alex",
            targetCalories: 2000,
            consumedCalories: 1500,
            proteinConsumedG: 90,
            carbsConsumedG: 180,
            fatConsumedG: 50,
            proteinTargetG: 140,
            carbsTargetG: 235,
            fatTargetG: 55,
            updatedAt: Date(timeIntervalSince1970: 1_700_000_000)
        )

        let encoded = try JSONEncoder().encode(data)
        let decoded = try JSONDecoder().decode(WidgetData.self, from: encoded)
        XCTAssertEqual(decoded, data)
    }
}
