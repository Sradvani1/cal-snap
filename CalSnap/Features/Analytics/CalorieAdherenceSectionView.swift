import Charts
import SwiftUI

struct CalorieAdherenceSectionView: View {
    let chartSeries: [DailyNutritionSummary]
    let calorieTarget: Int
    let averageDailyCalories: Int
    let adherencePct: Double

    var body: some View {
        AnalyticsSectionCard(title: String(localized: "analytics.section.calorieAdherence")) {
            VStack(alignment: .leading, spacing: 12) {
                if chartSeries.isEmpty {
                    EmptyStateView(
                        icon: "chart.bar",
                        title: String(localized: "common.empty.noMealData.title"),
                        message: String(localized: "common.empty.noMealData.message")
                    )
                } else {
                    Chart {
                        ForEach(chartSeries) { day in
                            BarMark(
                                x: .value("Date", day.date, unit: .day),
                                y: .value("Calories", day.calories)
                            )
                            .foregroundStyle(color(for: day.calories))
                        }
                        if calorieTarget > 0 {
                            RuleMark(y: .value("Target", calorieTarget))
                                .foregroundStyle(.secondary)
                                .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        }
                    }
                    .chartYAxisLabel(String(localized: "units.kcal"))
                    .frame(height: 200)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("analytics.calorie.chartAccessibility")
                    .accessibilityValue(adherenceAccessibilityValue)
                }

                HStack {
                    NutrientStatRow(label: String(localized: "analytics.calorie.avgIntake"), value: "\(averageDailyCalories)")
                    NutrientStatRow(label: String(localized: "common.label.target"), value: "\(calorieTarget)")
                    NutrientStatRow(label: String(localized: "analytics.calorie.onTarget"), value: String(format: "%.0f%%", adherencePct))
                }
            }
        }
    }

    private func color(for calories: Int) -> Color {
        guard calorieTarget > 0 else { return Color.csPrimary }
        return Color.calorieProgress(Double(calories) / Double(calorieTarget))
    }

    private var adherenceAccessibilityValue: String {
        String(format: String(localized: "analytics.calorie.adherenceAccessibility"), averageDailyCalories, calorieTarget, Int(adherencePct.rounded()))
    }
}
