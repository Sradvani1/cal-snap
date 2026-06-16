import Foundation

struct MealAnalysisRequest {
    let imageData: Data
    let mimeType: String
    let textDescription: String?
}

struct MealAnalysisResponse: Codable {
    struct FoodItemResult: Codable {
        let name: String
        let estimatedWeightG: Double
        let calories: Int
        let proteinG: Double
        let carbsG: Double
        let fatG: Double
        let fiberG: Double
        let confidence: Double
    }

    struct MealTotal: Codable {
        let calories: Int
        let proteinG: Double
        let carbsG: Double
        let fatG: Double
        let fiberG: Double
    }

    let items: [FoodItemResult]
    let mealTotal: MealTotal
    let flaggedItems: [String]
    let estimationNotes: String
}

enum GeminiError: Error, LocalizedError {
    case apiKeyMissing
    case emptyResponse
    case validationFailed
    case invalidJSON(String)
    case requestFailed(String)

    var errorDescription: String? {
        switch self {
        case .apiKeyMissing:
            return String(localized: "error.gemini.apiKeyMissing")
        case .emptyResponse:
            return String(localized: "error.gemini.emptyResponse")
        case .validationFailed:
            return String(localized: "error.gemini.validationFailed")
        case .invalidJSON(let message):
            return String(format: String(localized: "error.gemini.invalidJSON"), message)
        case .requestFailed(let message):
            return message
        }
    }
}

actor GeminiService {
    private let urlSession: URLSession

    init(urlSession: URLSession = .shared) {
        self.urlSession = urlSession
    }

    func validateAPIKey(_ key: String) async throws(GeminiError) -> Bool {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw GeminiError.apiKeyMissing }

        let client = makeClient(apiKey: trimmed)
        do {
            let text = try await client.generateText("Reply with OK")
            guard !text.isEmpty else {
                throw GeminiError.emptyResponse
            }
            return true
        } catch let error as GeminiError {
            throw error
        } catch {
            throw Self.mapRequestError(error)
        }
    }

    func analyzeMeal(_ request: MealAnalysisRequest) async throws(GeminiError) -> MealAnalysisResponse {
        let apiKey: String
        do {
            guard let key = try APIKeyResolver.resolvedGeminiAPIKey(),
                  !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw GeminiError.apiKeyMissing
            }
            apiKey = key
        } catch let error as GeminiError {
            throw error
        } catch {
            throw Self.mapRequestError(error)
        }

        let prompt = Self.buildMealAnalysisPrompt(description: request.textDescription)
        let client = makeClient(apiKey: apiKey)

        let text: String
        do {
            text = try await client.generateMultimodalJSON(
                prompt: prompt,
                imageData: request.imageData,
                mimeType: request.mimeType,
                jsonSchema: GeminiMealAnalysisSchema.jsonSchema()
            )
        } catch {
            throw Self.mapRequestError(error)
        }

        guard let data = MealAnalysisJSONParser.normalizedJSONData(from: text) else {
            throw GeminiError.emptyResponse
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        do {
            return try decoder.decode(MealAnalysisResponse.self, from: data)
        } catch {
            throw GeminiError.invalidJSON(MealAnalysisJSONParser.decodingErrorDescription(error))
        }
    }

    func generateAnalyticsInsight(_ payload: AnalyticsInsightPayload) async throws(GeminiError) -> String {
        let apiKey: String
        do {
            guard let key = try APIKeyResolver.resolvedGeminiAPIKey(),
                  !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw GeminiError.apiKeyMissing
            }
            apiKey = key
        } catch let error as GeminiError {
            throw error
        } catch {
            throw Self.mapRequestError(error)
        }

        let client = makeClient(apiKey: apiKey)
        let prompt = Self.buildAnalyticsInsightPrompt(payload)

        let text: String
        do {
            text = try await client.generateText(
                prompt,
                maxOutputTokens: AppConstants.Gemini.maxTokens
            )
        } catch {
            throw Self.mapRequestError(error)
        }

        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw GeminiError.emptyResponse
        }
        return trimmed
    }

    private func makeClient(apiKey: String) -> GeminiRESTClient {
        GeminiRESTClient(
            apiKey: apiKey.trimmingCharacters(in: .whitespacesAndNewlines),
            model: AppConstants.Gemini.model,
            urlSession: urlSession
        )
    }

    private static func mapRequestError(_ error: Error) -> GeminiError {
        if let urlError = error as? URLError, urlError.code == .notConnectedToInternet {
            return .requestFailed("No internet connection.")
        }

        if let restError = error as? GeminiRESTError {
            switch restError {
            case .invalidResponse:
                return .emptyResponse
            case .apiError(let status, let message, _):
                if message.localizedCaseInsensitiveContains("iOS client application") {
                    let bundleID = Bundle.main.bundleIdentifier ?? "unknown"
                    return .requestFailed(
                        "This API key is restricted to specific iOS apps. Add bundle ID \(bundleID) in Google AI Studio, or remove iOS restrictions."
                    )
                }
                if message.localizedCaseInsensitiveContains("has not been used in project")
                    || message.localizedCaseInsensitiveContains("it is disabled") {
                    return .requestFailed(
                        "Enable the Generative Language API for your Google Cloud project, then wait a few minutes and retry."
                    )
                }
                if message.localizedCaseInsensitiveContains("method google.ai.generativelanguage")
                    || message.localizedCaseInsensitiveContains("are blocked") {
                    return .requestFailed(
                        "This API key cannot call GenerateContent from the app. In Google Cloud Console → Credentials, edit the key and either set API restrictions to \"Don't restrict key\", or allow \"Generative Language API\"."
                    )
                }
                if status == "RESOURCE_EXHAUSTED"
                    || message.localizedCaseInsensitiveContains("quota")
                    || message.localizedCaseInsensitiveContains("rate limit") {
                    return .requestFailed("Gemini rate limit reached. Wait a minute and try again.")
                }
                if isInvalidAPIKeyError(status: status, message: message) {
                    return .validationFailed
                }
                if message == "User location is not supported for the API use." {
                    return .requestFailed(message)
                }
                return .requestFailed(message)
            }
        }

        return .requestFailed(error.localizedDescription)
    }

    private static func isInvalidAPIKeyError(status: String, message: String) -> Bool {
        if status == "UNAUTHENTICATED" || status == "INVALID_ARGUMENT" {
            return message.localizedCaseInsensitiveContains("API key")
                || message.localizedCaseInsensitiveContains("API_KEY")
        }
        return message.localizedCaseInsensitiveContains("API key not valid")
            || message.localizedCaseInsensitiveContains("invalid API key")
            || message.localizedCaseInsensitiveContains("API key expired")
            || message.localizedCaseInsensitiveContains("API_KEY_INVALID")
            || message.localizedCaseInsensitiveContains("reported as leaked")
    }

    private static func buildMealAnalysisPrompt(description: String?) -> String {
        var prompt = """
        Analyze this meal image and return a JSON nutritional breakdown.

        For each food item you can identify, estimate:
        - The item name (specific, e.g. "grilled chicken breast" not just "chicken")
        - Estimated weight in grams (use plate size, utensils, and visual proportion as references)
        - Calories
        - Protein in grams
        - Carbohydrates in grams (excluding fiber)
        - Fat in grams
        - Fiber in grams
        - Confidence score 0.0–1.0 (be honest; reduce confidence for partially visible items,
          unclear sauces/dressings, or ambiguous portions)

        Use standard USDA nutritional values as your reference database.
        Caloric density: carbs = 4 kcal/g, protein = 4 kcal/g, fat = 9 kcal/g, fiber = 2 kcal/g.

        Flag any item with confidence below 0.6 in the flaggedItems array.
        Include brief estimation_notes explaining your reasoning for portion sizes.
        """

        if let description, !description.isEmpty {
            prompt += "\n\nAdditional context from user: \(description)\nUse this to refine your estimates."
        }

        return prompt
    }

    private static func buildAnalyticsInsightPrompt(_ payload: AnalyticsInsightPayload) -> String {
        var lines: [String] = [
            "You are a nutrition coach. Based only on the aggregated dietary statistics below, write a 2–3 sentence actionable insight.",
            "Do not invent data beyond what is provided. Be encouraging and specific.",
            "",
            "Timeframe: \(payload.timeframeLabel)",
            "Logged days: \(payload.loggedDayCount)",
            "Average daily calories: \(payload.averageDailyCalories) (target: \(payload.calorieTarget))",
            "Days on target (±10%): \(String(format: "%.0f", payload.adherencePercent))%",
            "Macro split actual: \(payload.actualMacroSplit.proteinPct)% protein, \(payload.actualMacroSplit.carbsPct)% carbs, \(payload.actualMacroSplit.fatPct)% fat",
            "Macro split target: \(payload.targetMacroSplit.proteinPct)% protein, \(payload.targetMacroSplit.carbsPct)% carbs, \(payload.targetMacroSplit.fatPct)% fat",
            "Average daily fiber: \(String(format: "%.0f", payload.averageDailyFiberG))g (target: \(String(format: "%.0f", payload.fiberTargetG))g)",
        ]

        if let weekend = payload.weekendAverageCalories, let weekday = payload.weekdayAverageCalories {
            lines.append("Weekend avg calories: \(weekend); weekday avg: \(weekday)")
        }

        if !payload.topFoods.isEmpty {
            let foodSummary = payload.topFoods.map { "\($0.name) (\($0.count)×)" }.joined(separator: ", ")
            lines.append("Most logged foods: \(foodSummary)")
        }

        if let change = payload.weightChangeKg {
            let direction = change < 0 ? "lost" : "gained"
            lines.append("Weight change in period: \(direction) \(String(format: "%.1f", abs(change))) kg")
        }

        return lines.joined(separator: "\n")
    }
}
