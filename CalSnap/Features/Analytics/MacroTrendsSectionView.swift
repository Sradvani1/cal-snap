import Charts
import SwiftUI

struct MacroTrendsSectionView: View {
    let chartSeries: [DailyNutritionSummary]
    let actualMacroSplit: MacroSplit
    let targetMacroSplit: MacroSplit

    var body: some View {
        AnalyticsSectionCard(title: "Macro Trends") {
            VStack(alignment: .leading, spacing: 16) {
                if chartSeries.isEmpty {
                    Text("No meal data in this period")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Chart {
                        ForEach(chartSeries) { day in
                            let proteinKcal = day.proteinG * AppConstants.Nutrition.proteinCalPerGram
                            let carbsKcal = day.carbsG * AppConstants.Nutrition.carbsCalPerGram
                            let fatKcal = day.fatG * AppConstants.Nutrition.fatCalPerGram

                            BarMark(
                                x: .value("Date", day.date, unit: .day),
                                y: .value("Kcal", proteinKcal),
                                stacking: .standard
                            )
                            .foregroundStyle(by: .value("Macro", "Protein"))

                            BarMark(
                                x: .value("Date", day.date, unit: .day),
                                y: .value("Kcal", carbsKcal),
                                stacking: .standard
                            )
                            .foregroundStyle(by: .value("Macro", "Carbs"))

                            BarMark(
                                x: .value("Date", day.date, unit: .day),
                                y: .value("Kcal", fatKcal),
                                stacking: .standard
                            )
                            .foregroundStyle(by: .value("Macro", "Fat"))
                        }
                    }
                    .chartForegroundStyleScale([
                        "Protein": Color.blue,
                        "Carbs": Color.orange,
                        "Fat": Color.purple,
                    ])
                    .chartYAxisLabel("kcal")
                    .frame(height: 200)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Average macro split")
                        .font(.subheadline.weight(.semibold))
                    HStack(spacing: 16) {
                        macroSplitColumn(title: "Actual", split: actualMacroSplit)
                        macroSplitColumn(title: "Target", split: targetMacroSplit)
                    }
                }
            }
        }
    }

    private func macroSplitColumn(title: String, split: MacroSplit) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            GeometryReader { geometry in
                HStack(spacing: 0) {
                    Color.blue.frame(width: geometry.size.width * CGFloat(split.proteinPct) / 100)
                    Color.orange.frame(width: geometry.size.width * CGFloat(split.carbsPct) / 100)
                    Color.purple.frame(width: geometry.size.width * CGFloat(split.fatPct) / 100)
                }
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }
            .frame(height: 12)
            Text("P \(split.proteinPct)% · C \(split.carbsPct)% · F \(split.fatPct)%")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    MacroTrendsSectionView(
        chartSeries: [
            DailyNutritionSummary(date: Date.now, calories: 2000, proteinG: 120, carbsG: 200, fatG: 60, fiberG: 20),
        ],
        actualMacroSplit: MacroSplit(proteinPct: 28, carbsPct: 47, fatPct: 25),
        targetMacroSplit: MacroSplit(proteinPct: 28, carbsPct: 47, fatPct: 25)
    )
    .padding()
}
