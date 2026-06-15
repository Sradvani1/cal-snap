import Foundation
import GoogleGenerativeAI

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
            return "Gemini API key not configured. Add a key during setup or enter the meal manually."
        case .emptyResponse:
            return "Gemini returned an empty response."
        case .validationFailed:
            return "Could not validate Gemini API key."
        case .invalidJSON(let message):
            return "Could not parse Gemini response: \(message)"
        case .requestFailed(let message):
            return message
        }
    }
}

actor GeminiService {
    func validateAPIKey(_ key: String) async throws(GeminiError) -> Bool {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw GeminiError.apiKeyMissing }

        let model = GenerativeModel(name: AppConstants.Gemini.model, apiKey: trimmed)
        do {
            let response = try await model.generateContent("Reply with OK")
            guard let text = response.text, !text.isEmpty else {
                throw GeminiError.emptyResponse
            }
            return true
        } catch let error as GeminiError {
            throw error
        } catch {
            throw GeminiError.validationFailed
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

        let model = GenerativeModel(
            name: AppConstants.Gemini.model,
            apiKey: apiKey,
            generationConfig: GenerationConfig(
                responseMIMEType: "application/json",
                responseSchema: Self.responseSchema
            )
        )

        let prompt = Self.buildPrompt(description: request.textDescription)
        let textPart = ModelContent.Part.text(prompt)
        let imagePart = ModelContent.Part.data(mimetype: request.mimeType, request.imageData)

        let response: GenerateContentResponse
        do {
            response = try await model.generateContent([textPart, imagePart])
        } catch {
            throw Self.mapRequestError(error)
        }

        guard let text = response.text,
              let data = text.data(using: .utf8) else {
            throw GeminiError.emptyResponse
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        do {
            return try decoder.decode(MealAnalysisResponse.self, from: data)
        } catch {
            throw GeminiError.invalidJSON(error.localizedDescription)
        }
    }

    private static func mapRequestError(_ error: Error) -> GeminiError {
        if let urlError = error as? URLError, urlError.code == .notConnectedToInternet {
            return .requestFailed("No internet connection.")
        }
        return .requestFailed(error.localizedDescription)
    }

    private static func buildPrompt(description: String?) -> String {
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

    private static var responseSchema: Schema {
        Schema(
            type: .object,
            properties: [
                "items": Schema(
                    type: .array,
                    items: Schema(
                        type: .object,
                        properties: [
                            "name": Schema(type: .string),
                            "estimated_weight_g": Schema(type: .number),
                            "calories": Schema(type: .integer),
                            "protein_g": Schema(type: .number),
                            "carbs_g": Schema(type: .number),
                            "fat_g": Schema(type: .number),
                            "fiber_g": Schema(type: .number),
                            "confidence": Schema(type: .number),
                        ]
                    )
                ),
                "meal_total": Schema(
                    type: .object,
                    properties: [
                        "calories": Schema(type: .integer),
                        "protein_g": Schema(type: .number),
                        "carbs_g": Schema(type: .number),
                        "fat_g": Schema(type: .number),
                        "fiber_g": Schema(type: .number),
                    ]
                ),
                "flagged_items": Schema(
                    type: .array,
                    items: Schema(type: .string)
                ),
                "estimation_notes": Schema(type: .string),
            ]
        )
    }
}
