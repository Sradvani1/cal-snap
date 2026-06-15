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
                    Text("No meal data in this period")
                        .font(.caption)
                        .foregroundStyle(.secondary)
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
                    statBlock(title: "Avg intake", value: "\(averageDailyCalories)")
                    statBlock(title: "Target", value: "\(calorieTarget)")
                    statBlock(title: "On target", value: String(format: "%.0f%%", adherencePct))
                }
            }
        }
    }

    private func color(for calories: Int) -> Color {
        guard calorieTarget > 0 else { return .accentColor }
        let band = CalorieProgressBand.progressBand(for: Double(calories) / Double(calorieTarget))
        switch band {
        case .under: return .green
        case .onTrack: return .yellow
        case .over: return .red
        }
    }

    private func statBlock(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var adherenceAccessibilityValue: String {
        "Average \(averageDailyCalories) calories, target \(calorieTarget), \(Int(adherencePct.rounded())) percent of logged days on target"
    }
}

#Preview {
    CalorieAdherenceSectionView(
        chartSeries: [
            DailyNutritionSummary(date: Date.now, calories: 1900, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0),
        ],
        calorieTarget: 2000,
        averageDailyCalories: 1900,
        adherencePct: 57
    )
    .padding()
}
