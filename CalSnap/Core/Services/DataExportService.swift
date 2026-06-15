import Foundation

enum DataExportService {
    private static let mealsHeader =
        "id,userId,timestamp,mealType,calories,proteinG,carbsG,fatG,fiberG,confidence,isManuallyAdjusted,description"
    private static let weighInsHeader =
        "id,userId,date,weightKg,tdee,target,bmi,sourceIsHealthKit"

    static func makeCSV(meals: [MealEntry], weighIns: [WeighIn]) -> String {
        var lines: [String] = ["# meals", mealsHeader]

        let sortedMeals = meals.sorted { $0.timestamp < $1.timestamp }
        for meal in sortedMeals {
            let description = meal.textDescription ?? ""
            lines.append([
                meal.id.uuidString,
                meal.userId.uuidString,
                iso8601(meal.timestamp),
                meal.mealType.rawValue,
                String(meal.totalCalories),
                formatDouble(meal.totalProteinG),
                formatDouble(meal.totalCarbsG),
                formatDouble(meal.totalFatG),
                formatDouble(meal.totalFiberG),
                formatDouble(meal.geminiConfidence),
                meal.isManuallyAdjusted ? "true" : "false",
                escapeCSV(description),
            ].joined(separator: ","))
        }

        lines.append("# weigh_ins")
        lines.append(weighInsHeader)

        let sortedWeighIns = weighIns.sorted { $0.date < $1.date }
        for weighIn in sortedWeighIns {
            lines.append([
                weighIn.id.uuidString,
                weighIn.userId.uuidString,
                iso8601(weighIn.date),
                formatDouble(weighIn.weightKg),
                String(weighIn.calculatedTDEE),
                String(weighIn.adjustedDailyTarget),
                formatDouble(weighIn.bmi),
                weighIn.sourceIsHealthKit ? "true" : "false",
            ].joined(separator: ","))
        }

        return lines.joined(separator: "\n")
    }

    private static func escapeCSV(_ value: String) -> String {
        guard value.contains(",") || value.contains("\"") || value.contains("\n") else {
            return value
        }
        return "\"" + value.replacingOccurrences(of: "\"", with: "\"\"") + "\""
    }

    private static func iso8601(_ date: Date) -> String {
        date.ISO8601Format()
    }

    private static func formatDouble(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(0...2)))
    }
}
