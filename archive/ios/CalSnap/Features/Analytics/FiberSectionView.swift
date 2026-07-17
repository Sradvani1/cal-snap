import Charts
import SwiftUI

struct FiberSectionView: View {
    let chartSeries: [DailyNutritionSummary]
    let fiberTargetG: Double
    let daysMeetingFiberTarget: Int
    let loggedDayCount: Int

    var body: some View {
        AnalyticsSectionCard(title: String(localized: "analytics.section.fiber")) {
            VStack(alignment: .leading, spacing: 12) {
                if chartSeries.isEmpty {
                    EmptyStateView(
                        icon: "leaf",
                        title: String(localized: "common.empty.noMealData.title"),
                        message: String(localized: "common.empty.noMealData.message")
                    )
                } else {
                    Chart {
                        ForEach(chartSeries) { day in
                            BarMark(x: .value("Date", day.date, unit: .day), y: .value("Fiber", day.fiberG))
                                .foregroundStyle(day.fiberG >= fiberTargetG ? Color.csSuccess : Color.csAccent)
                        }
                        if fiberTargetG > 0 {
                            RuleMark(y: .value("Target", fiberTargetG))
                                .foregroundStyle(.secondary)
                                .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        }
                    }
                    .chartYAxisLabel(String(localized: "units.grams"))
                    .frame(height: 180)
                }

                Text(String(format: String(localized: "analytics.fiber.daysMeetingTarget"), daysMeetingFiberTarget, loggedDayCount))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
