import Foundation

enum APIKeyResolver {
    static func resolvedGeminiAPIKey() throws -> String? {
        try KeychainManager.load(for: .geminiAPIKey)
    }

    static func resolvedUSDAAPIKey() throws -> String {
        if let stored = try KeychainManager.load(for: .usdaAPIKey), !stored.isEmpty {
            return stored
        }
        return AppConstants.USDA.demoAPIKey
    }
}
