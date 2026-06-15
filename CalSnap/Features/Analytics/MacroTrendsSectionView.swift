import Charts
import SwiftUI

struct MacroTrendsSectionView: View {
    let chartSeries: [DailyNutritionSummary]
    let actualMacroSplit: MacroSplit
    let targetMacroSplit: MacroSplit

    var body: some View {
        AnalyticsSectionCard(title: String(localized: "analytics.section.macroTrends")) {
            VStack(alignment: .leading, spacing: 16) {
                if chartSeries.isEmpty {
                    EmptyStateView(
                        icon: "chart.bar",
                        title: String(localized: "common.empty.noMealData.title"),
                        message: String(localized: "common.empty.noMealData.message")
                    )
                } else {
                    Chart {
                        ForEach(chartSeries) { day in
                            let proteinKcal = day.proteinG * AppConstants.Nutrition.proteinCalPerGram
                            let carbsKcal = day.carbsG * AppConstants.Nutrition.carbsCalPerGram
                            let fatKcal = day.fatG * AppConstants.Nutrition.fatCalPerGram

                            BarMark(x: .value("Date", day.date, unit: .day), y: .value("Kcal", proteinKcal), stacking: .standard)
                                .foregroundStyle(by: .value("Macro", String(localized: "designSystem.macroBar.protein")))
                            BarMark(x: .value("Date", day.date, unit: .day), y: .value("Kcal", carbsKcal), stacking: .standard)
                                .foregroundStyle(by: .value("Macro", String(localized: "designSystem.macroBar.carbs")))
                            BarMark(x: .value("Date", day.date, unit: .day), y: .value("Kcal", fatKcal), stacking: .standard)
                                .foregroundStyle(by: .value("Macro", String(localized: "designSystem.macroBar.fat")))
                        }
                    }
                    .chartForegroundStyleScale([
                        String(localized: "designSystem.macroBar.protein"): Color.csProtein,
                        String(localized: "designSystem.macroBar.carbs"): Color.csCarbs,
                        String(localized: "designSystem.macroBar.fat"): Color.csFat,
                    ])
                    .chartYAxisLabel(String(localized: "units.kcal"))
                    .frame(height: 200)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("analytics.macro.averageSplit")
                        .font(.subheadline.weight(.semibold))
                    HStack(spacing: 16) {
                        macroSplitColumn(title: String(localized: "analytics.macro.actual"), split: actualMacroSplit)
                        macroSplitColumn(title: String(localized: "common.label.target"), split: targetMacroSplit)
                    }
                }
            }
        }
    }

    private func macroSplitColumn(title: String, split: MacroSplit) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.csCaption).foregroundStyle(.secondary)
            GeometryReader { geometry in
                HStack(spacing: 0) {
                    Color.csProtein.frame(width: geometry.size.width * CGFloat(split.proteinPct) / 100)
                    Color.csCarbs.frame(width: geometry.size.width * CGFloat(split.carbsPct) / 100)
                    Color.csFat.frame(width: geometry.size.width * CGFloat(split.fatPct) / 100)
                }
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }
            .frame(height: 12)
            Text(String(format: String(localized: "analytics.macro.splitFormat"), split.proteinPct, split.carbsPct, split.fatPct))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
