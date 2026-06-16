import XCTest
@testable import CalSnap

final class KeychainManagerTests: XCTestCase {
    private let testAccount = "com.calsnap.test_key"

    override func setUp() {
        super.setUp()
        KeychainManager.delete(account: testAccount)
        KeychainManager.delete(for: .geminiAPIKey)
    }

    override func tearDown() {
        KeychainManager.delete(account: testAccount)
        KeychainManager.delete(for: .geminiAPIKey)
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

    func testSaveLoadDeleteRoundTripWithKeychainKey() throws {
        try KeychainManager.save("test-gemini-key", for: .geminiAPIKey)
        let loaded = try KeychainManager.load(for: .geminiAPIKey)
        XCTAssertEqual(loaded, "test-gemini-key")

        KeychainManager.delete(for: .geminiAPIKey)
        let afterDelete = try KeychainManager.load(for: .geminiAPIKey)
        XCTAssertNil(afterDelete)
    }

    func testLoadMissingKeyReturnsNil() throws {
        let loaded = try KeychainManager.load(account: testAccount)
        XCTAssertNil(loaded)
    }

    func testGeminiKeyForValidationPrefersInputOverKeychain() throws {
        try KeychainManager.save("stored-key", for: .geminiAPIKey)
        let resolved = try APIKeyResolver.geminiKeyForValidation(preferredInput: " typed-key ")
        XCTAssertEqual(resolved, "typed-key")
    }

    func testGeminiKeyForValidationFallsBackToKeychain() throws {
        try KeychainManager.save("stored-key", for: .geminiAPIKey)
        let resolved = try APIKeyResolver.geminiKeyForValidation(preferredInput: "   ")
        XCTAssertEqual(resolved, "stored-key")
    }
}
