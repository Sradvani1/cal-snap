import Security

enum KeychainKey: String {
    case geminiAPIKey = "com.calsnap.gemini_api_key"
    case usdaAPIKey = "com.calsnap.usda_api_key"
}

enum KeychainError: Error {
    case saveFailed(OSStatus)
}

struct KeychainManager {
    // kSecAttrService namespaces items per app (spec extension vs technical-spec snippet)
    private static let service = "com.calsnap.app"

    static func save(_ value: String, for key: KeychainKey) throws {
        try save(value, account: key.rawValue)
    }

    static func load(for key: KeychainKey) throws -> String? {
        try load(account: key.rawValue)
    }

    static func delete(for key: KeychainKey) {
        delete(account: key.rawValue)
    }

    static func save(_ value: String, account: String) throws {
        let data = Data(value.utf8)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
            kSecValueData: data,
            kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.saveFailed(status) }
    }

    static func load(account: String) throws -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func delete(account: String) {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
