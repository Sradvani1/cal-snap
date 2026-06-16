import Foundation

enum APIKeyResolver {
    static func resolvedGeminiAPIKey() throws -> String? {
        try KeychainManager.load(for: .geminiAPIKey)
    }

    /// Uses trimmed field input when present; otherwise falls back to Keychain.
    static func geminiKeyForValidation(preferredInput: String) throws -> String? {
        let trimmed = preferredInput.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty {
            return trimmed
        }
        return try resolvedGeminiAPIKey()
    }

    static func resolvedUSDAAPIKey() throws -> String {
        if let stored = try KeychainManager.load(for: .usdaAPIKey), !stored.isEmpty {
            return stored
        }
        return AppConstants.USDA.demoAPIKey
    }
}
