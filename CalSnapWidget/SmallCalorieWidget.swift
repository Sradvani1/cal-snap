import SwiftUI
import WidgetKit

struct SmallCalorieWidgetView: View {
    let data: WidgetData?

    private var remaining: Int {
        guard let data else { return 0 }
        return data.targetCalories - data.consumedCalories
    }

    private var progress: Double {
        guard let data, data.targetCalories > 0 else { return 0 }
        return min(Double(data.consumedCalories) / Double(data.targetCalories), 1)
    }

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(ringColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 2) {
                    Text("\(abs(remaining))")
                        .font(.title2.bold().monospacedDigit())
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                    Text(remaining >= 0 ? "widget.small.left" : "widget.small.over")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: 88, maxHeight: 88)

            if let data {
                Text(String(format: String(localized: "widget.small.ofGoal"), data.targetCalories))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            } else {
                Text("widget.small.openApp")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var ringColor: Color {
        guard let data, data.targetCalories > 0 else { return .green }
        let ratio = Double(data.consumedCalories) / Double(data.targetCalories)
        switch ratio {
        case ..<0.90: return .green
        case 0.90..<1.10: return .orange
        default: return .red
        }
    }
}

struct SmallCalorieWidget: Widget {
    let kind = "SmallCalorieWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalorieWidgetProvider()) { entry in
            SmallCalorieWidgetView(data: entry.data)
        }
        .configurationDisplayName(LocalizedStringResource("widget.small.displayName"))
        .description(LocalizedStringResource("widget.small.description"))
        .supportedFamilies([.systemSmall])
    }
}
