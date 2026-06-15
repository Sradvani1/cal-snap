import Charts
import SwiftUI

struct CalorieAdherenceSectionView: View {
    let chartSeries: [DailyNutritionSummary]
    let calorieTarget: Int
    let averageDailyCalories: Int
    let adherencePct: Double

    var body: some View {
        AnalyticsSectionCard(title: "Calorie Adherence") {
            VStack(alignment: .leading, spacing: 12) {
                if chartSeries.isEmpty {
                    EmptyStateView(icon: "chart.bar", title: "No meal data", message: "No meals logged in this period.")
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
                    .chartYAxisLabel("kcal")
                    .frame(height: 200)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Daily calories chart")
                    .accessibilityValue(adherenceAccessibilityValue)
                }

                HStack {
                    NutrientStatRow(label: "Avg intake", value: "\(averageDailyCalories)")
                    NutrientStatRow(label: "Target", value: "\(calorieTarget)")
                    NutrientStatRow(label: "On target", value: String(format: "%.0f%%", adherencePct))
                }
            }
        }
    }

    private func color(for calories: Int) -> Color {
        guard calorieTarget > 0 else { return Color.csPrimary }
        return Color.calorieProgress(Double(calories) / Double(calorieTarget))
    }

    private var adherenceAccessibilityValue: String {
        "Average \(averageDailyCalories) calories, target \(calorieTarget), \(Int(adherencePct.rounded())) percent of logged days on target"
    }
}
