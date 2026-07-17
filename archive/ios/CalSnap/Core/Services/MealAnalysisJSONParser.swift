import Foundation

enum MealAnalysisJSONParser {
    static func normalizedJSONData(from modelText: String) -> Data? {
        for candidate in jsonCandidates(from: modelText) {
            guard let data = candidate.data(using: .utf8) else { continue }
            if isValidJSONObject(data) {
                return data
            }
        }
        return jsonCandidates(from: modelText).last?.data(using: .utf8)
    }

    static func extractJSONObject(from text: String) -> String {
        if let data = normalizedJSONData(from: text),
           let json = String(data: data, encoding: .utf8) {
            return json
        }
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func decodingErrorDescription(_ error: Error) -> String {
        guard let decoding = error as? DecodingError else {
            return error.localizedDescription
        }
        switch decoding {
        case .keyNotFound(let key, let context):
            let path = context.codingPath.map(\.stringValue).joined(separator: ".")
            return "Missing key '\(key.stringValue)' at \(path)"
        case .typeMismatch(let type, let context):
            let path = context.codingPath.map(\.stringValue).joined(separator: ".")
            return "Expected \(type) at \(path)"
        case .valueNotFound(let type, let context):
            let path = context.codingPath.map(\.stringValue).joined(separator: ".")
            return "Missing value \(type) at \(path)"
        case .dataCorrupted(let context):
            return context.debugDescription
        @unknown default:
            return decoding.localizedDescription
        }
    }

    static func isValidJSONObject(_ data: Data) -> Bool {
        guard let object = try? JSONSerialization.jsonObject(with: data) else { return false }
        return object is [String: Any]
    }

    private static func jsonCandidates(from text: String) -> [String] {
        var trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("```") {
            trimmed = stripMarkdownFence(trimmed)
        }

        var candidates: [String] = []

        if trimmed.first == "\"",
           let data = trimmed.data(using: .utf8),
           let inner = try? JSONDecoder().decode(String.self, from: data) {
            candidates.append(contentsOf: jsonCandidates(from: inner))
        }

        if let balanced = extractBalancedJSONObject(from: trimmed) {
            candidates.append(balanced)
        }

        candidates.append(trimmed)

        if trimmed.first != "{",
           let start = trimmed.firstIndex(of: "{"),
           let end = trimmed.lastIndex(of: "}") {
            candidates.append(String(trimmed[start ... end]))
        }

        var seen = Set<String>()
        return candidates
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .filter { seen.insert($0).inserted }
    }

    private static func extractBalancedJSONObject(from text: String) -> String? {
        guard let start = text.firstIndex(of: "{") else { return nil }

        var depth = 0
        var inString = false
        var isEscaped = false

        for index in text.indices[start...] {
            let character = text[index]
            if inString {
                if isEscaped {
                    isEscaped = false
                } else if character == "\\" {
                    isEscaped = true
                } else if character == "\"" {
                    inString = false
                }
                continue
            }

            switch character {
            case "\"":
                inString = true
            case "{":
                depth += 1
            case "}":
                depth -= 1
                if depth == 0 {
                    return String(text[start ... index])
                }
            default:
                break
            }
        }

        return nil
    }

    private static func stripMarkdownFence(_ text: String) -> String {
        var result = text
        if result.hasPrefix("```") {
            result.removeFirst(3)
            if let newline = result.firstIndex(of: "\n") {
                result = String(result[result.index(after: newline)...])
            }
        }
        if result.hasSuffix("```") {
            result.removeLast(3)
        }
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
