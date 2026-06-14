import XCTest
@testable import CalSnap

final class KeychainManagerTests: XCTestCase {
    private let testAccount = "com.calsnap.test_key"

    override func setUp() {
        super.setUp()
        KeychainManager.delete(account: testAccount)
    }

    override func tearDown() {
        KeychainManager.delete(account: testAccount)
        super.tearDown()
    }

    func testSaveLoadDeleteRoundTrip() throws {
        try KeychainManager.save("test-secret-value", account: testAccount)
        let loaded = try KeychainManager.load(account: testAccount)
        XCTAssertEqual(loaded, "test-secret-value")

        KeychainManager.delete(account: testAccount)
        let afterDelete = try KeychainManager.load(account: testAccount)
        XCTAssertNil(afterDelete)
    }
}
