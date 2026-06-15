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
                    Text("No meal data in this period")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Chart {
                        ForEach(chartSeries) { day in
                            BarMark(
                                x: .value("Date", day.date, unit: .day),
                                y: .value("Fiber", day.fiberG)
                            )
                            .foregroundStyle(day.fiberG >= fiberTargetG ? Color.green : Color.orange)
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

#Preview {
    FiberSectionView(
        chartSeries: [
            DailyNutritionSummary(date: Date.now, calories: 2000, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 18),
        ],
        fiberTargetG: 28,
        daysMeetingFiberTarget: 0,
        loggedDayCount: 1
    )
    .padding()
}
