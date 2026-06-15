import Charts
import SwiftUI

struct PatternsSectionView: View {
    let dayOfWeekBreakdown: [Weekday: Int]
    let timeOfDayBreakdown: [TimeOfDayBucket: Int]
    let weekendAverageCalories: Int?
    let weekdayAverageCalories: Int?
    let topFoods: [TopFoodEntry]

    var body: some View {
        AnalyticsSectionCard(title: "Patterns") {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Calories by day of week")
                        .font(.subheadline.weight(.semibold))
                    Chart {
                        ForEach(Weekday.allCases, id: \.self) { weekday in
                            BarMark(
                                x: .value("Day", weekday.shortLabel),
                                y: .value("Calories", dayOfWeekBreakdown[weekday, default: 0])
                            )
                            .foregroundStyle(weekday.isWeekend ? Color.orange : Color.accentColor)
                        }
                    }
                    .frame(height: 160)
                }

                if let weekend = weekendAverageCalories, let weekday = weekdayAverageCalories {
                    let delta = weekend - weekday
                    let deltaText = delta >= 0 ? "+\(delta)" : "\(delta)"
                    Text("Weekend avg: \(weekend) kcal · Weekday avg: \(weekday) kcal (\(deltaText) vs weekdays)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Calories by time of day")
                        .font(.subheadline.weight(.semibold))
                    Chart {
                        ForEach(TimeOfDayBucket.allCases, id: \.self) { bucket in
                            BarMark(
                                x: .value("Time", bucket.displayLabel),
                                y: .value("Calories", timeOfDayBreakdown[bucket, default: 0])
                            )
                            .foregroundStyle(Color.accentColor)
                        }
                    }
                    .frame(height: 160)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Top logged foods")
                        .font(.subheadline.weight(.semibold))
                    if topFoods.isEmpty {
                        Text("No food items logged yet")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(topFoods) { food in
                            HStack {
                                Text(food.name)
                                Spacer()
                                Text("\(food.count)× · ~\(food.avgCalories) kcal")
                                    .foregroundStyle(.secondary)
                            }
                            .font(.subheadline)
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    PatternsSectionView(
        dayOfWeekBreakdown: [.monday: 1100, .wednesday: 800],
        timeOfDayBreakdown: [.morning: 400, .evening: 900],
        weekendAverageCalories: 2200,
        weekdayAverageCalories: 1800,
        topFoods: [TopFoodEntry(name: "Chicken", count: 4, avgCalories: 200)]
    )
    .padding()
}
