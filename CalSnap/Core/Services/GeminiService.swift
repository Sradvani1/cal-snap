import Foundation
import GoogleGenerativeAI

enum GeminiError: Error, LocalizedError {
    case apiKeyMissing
    case emptyResponse
    case validationFailed

    var errorDescription: String? {
        switch self {
        case .apiKeyMissing:
            return "Gemini API key not configured."
        case .emptyResponse:
            return "Gemini returned an empty response."
        case .validationFailed:
            return "Could not validate Gemini API key."
        }
    }
}

actor GeminiService {
    func validateAPIKey(_ key: String) async throws -> Bool {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw GeminiError.apiKeyMissing }

        let model = GenerativeModel(name: AppConstants.Gemini.model, apiKey: trimmed)
        let response = try await model.generateContent("Reply with OK")
        guard let text = response.text, !text.isEmpty else {
            throw GeminiError.emptyResponse
        }
        return true
    }
}
