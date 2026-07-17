import Foundation

enum GeminiRESTError: Error, LocalizedError, Equatable {
    case invalidResponse
    case apiError(status: String, message: String, httpCode: Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from Gemini API."
        case .apiError(_, let message, _):
            return message
        }
    }
}

struct GeminiRESTClient {
    private static let baseURL = "https://generativelanguage.googleapis.com/v1beta"

    let apiKey: String
    let model: String
    let urlSession: URLSession

    init(apiKey: String, model: String, urlSession: URLSession = .shared) {
        self.apiKey = apiKey
        self.model = model
        self.urlSession = urlSession
    }

    func generateText(_ prompt: String, maxOutputTokens: Int? = nil) async throws -> String {
        let parts: [[String: Any]] = [["text": prompt]]
        return try await generateContent(parts: parts, generationConfig: textGenerationConfig(maxOutputTokens: maxOutputTokens))
    }

    func generateMultimodalJSON(
        prompt: String,
        imageData: Data,
        mimeType: String,
        jsonSchema: [String: Any],
        maxOutputTokens: Int? = nil
    ) async throws -> String {
        let parts: [[String: Any]] = [
            ["text": prompt],
            [
                "inline_data": [
                    "mime_type": mimeType,
                    "data": imageData.base64EncodedString(),
                ],
            ],
        ]
        var generationConfig: [String: Any] = [
            "responseMimeType": "application/json",
            "responseJsonSchema": jsonSchema,
        ]
        if let maxOutputTokens {
            generationConfig["maxOutputTokens"] = maxOutputTokens
        }
        return try await generateContent(parts: parts, generationConfig: generationConfig)
    }

    private func textGenerationConfig(maxOutputTokens: Int?) -> [String: Any]? {
        guard let maxOutputTokens else { return nil }
        return ["maxOutputTokens": maxOutputTokens]
    }

    private func generateContent(
        parts: [[String: Any]],
        generationConfig: [String: Any]?
    ) async throws -> String {
        var body: [String: Any] = [
            "contents": [
                ["parts": parts],
            ],
        ]
        if let generationConfig {
            body["generationConfig"] = generationConfig
        }

        let requestBody = try JSONSerialization.data(withJSONObject: body)
        let url = URL(string: "\(Self.baseURL)/models/\(model):generateContent")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-goog-api-key")
        if let bundleIdentifier = Bundle.main.bundleIdentifier, !bundleIdentifier.isEmpty {
            request.setValue(bundleIdentifier, forHTTPHeaderField: "x-ios-bundle-identifier")
        }
        request.httpBody = requestBody

        let (data, response) = try await urlSession.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GeminiRESTError.invalidResponse
        }

        guard (200 ... 299).contains(httpResponse.statusCode) else {
            throw parseAPIError(data: data, httpCode: httpResponse.statusCode)
        }

        guard let text = try parseResponseText(from: data), !text.isEmpty else {
            throw GeminiRESTError.invalidResponse
        }
        return text
    }

    private func parseResponseText(from data: Data) throws -> String? {
        let response = try JSONDecoder().decode(GenerateContentResponse.self, from: data)
        return response.candidates?.first?.content?.parts?.compactMap(\.text).joined()
    }

    private func parseAPIError(data: Data, httpCode: Int) -> GeminiRESTError {
        if let decoded = try? JSONDecoder().decode(GeminiAPIErrorEnvelope.self, from: data),
           let message = decoded.error?.message, !message.isEmpty {
            let status = decoded.error?.status ?? "HTTP_\(httpCode)"
            return .apiError(status: status, message: message, httpCode: httpCode)
        }
        if let payload = String(data: data, encoding: .utf8), !payload.isEmpty {
            return .apiError(status: "HTTP_\(httpCode)", message: payload, httpCode: httpCode)
        }
        return .apiError(status: "HTTP_\(httpCode)", message: "Gemini request failed.", httpCode: httpCode)
    }
}

private struct GenerateContentResponse: Decodable {
    struct Candidate: Decodable {
        struct Content: Decodable {
            struct Part: Decodable {
                let text: String?
            }

            let parts: [Part]?
        }

        let content: Content?
    }

    let candidates: [Candidate]?
}

private struct GeminiAPIErrorEnvelope: Decodable {
    struct APIError: Decodable {
        let code: Int?
        let message: String?
        let status: String?
    }

    let error: APIError?
}

enum GeminiMealAnalysisSchema {
    static func jsonSchema() -> [String: Any] {
        [
            "type": "object",
            "properties": [
                "items": [
                    "type": "array",
                    "items": [
                        "type": "object",
                        "properties": [
                            "name": ["type": "string"],
                            "estimated_weight_g": ["type": "number"],
                            "calories": ["type": "integer"],
                            "protein_g": ["type": "number"],
                            "carbs_g": ["type": "number"],
                            "fat_g": ["type": "number"],
                            "fiber_g": ["type": "number"],
                            "confidence": ["type": "number"],
                        ],
                        "required": [
                            "name",
                            "estimated_weight_g",
                            "calories",
                            "protein_g",
                            "carbs_g",
                            "fat_g",
                            "fiber_g",
                            "confidence",
                        ],
                    ],
                ],
                "meal_total": [
                    "type": "object",
                    "properties": [
                        "calories": ["type": "integer"],
                        "protein_g": ["type": "number"],
                        "carbs_g": ["type": "number"],
                        "fat_g": ["type": "number"],
                        "fiber_g": ["type": "number"],
                    ],
                    "required": [
                        "calories",
                        "protein_g",
                        "carbs_g",
                        "fat_g",
                        "fiber_g",
                    ],
                ],
                "flagged_items": [
                    "type": "array",
                    "items": ["type": "string"],
                ],
                "estimation_notes": ["type": "string"],
            ],
            "required": [
                "items",
                "meal_total",
                "flagged_items",
                "estimation_notes",
            ],
        ]
    }
}
