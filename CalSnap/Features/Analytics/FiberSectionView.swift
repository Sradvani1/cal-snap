import Charts
import SwiftUI

struct FiberSectionView: View {
    let chartSeries: [DailyNutritionSummary]
    let fiberTargetG: Double
    let daysMeetingFiberTarget: Int
    let loggedDayCount: Int

    var body: some View {
        AnalyticsSectionCard(title: "Fiber & Micronutrients") {
            VStack(alignment: .leading, spacing: 12) {
                if chartSeries.isEmpty {
                    EmptyStateView(icon: "leaf", title: "No meal data", message: "No meals logged in this period.")
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
                    .chartYAxisLabel("g")
                    .frame(height: 180)
                }

                Text("Days meeting fiber target: \(daysMeetingFiberTarget) of \(loggedDayCount)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
