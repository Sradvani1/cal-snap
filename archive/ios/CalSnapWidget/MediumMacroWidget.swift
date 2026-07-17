import SwiftUI
import WidgetKit

struct MediumMacroWidgetView: View {
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
        HStack(spacing: 12) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .stroke(Color.secondary.opacity(0.2), lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(ringColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(abs(remaining))")
                        .font(.headline.monospacedDigit())
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                }
                .frame(width: 72, height: 72)
                Text("widget.medium.kcalLeft")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            if let data {
                VStack(alignment: .leading, spacing: 8) {
                    macroRow(label: String(localized: "designSystem.macroBar.protein"), consumed: data.proteinConsumedG, target: data.proteinTargetG, color: .blue)
                    macroRow(label: String(localized: "designSystem.macroBar.carbs"), consumed: data.carbsConsumedG, target: data.carbsTargetG, color: .orange)
                    macroRow(label: String(localized: "designSystem.macroBar.fat"), consumed: data.fatConsumedG, target: data.fatTargetG, color: .purple)
                }
            } else {
                Text("widget.medium.openApp")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private func macroRow(label: String, consumed: Double, target: Double, color: Color) -> some View {
        let ratio = target > 0 ? min(consumed / target, 1) : 0
        return VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(label)
                    .font(.caption2)
                Spacer()
                Text(String(format: String(localized: "units.gramsValue"), Int(consumed.rounded())))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.2))
                    Capsule().fill(color).frame(width: geo.size.width * ratio)
                }
            }
            .frame(height: 6)
        }
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

struct MediumMacroWidget: Widget {
    let kind = "MediumMacroWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalorieWidgetProvider()) { entry in
            MediumMacroWidgetView(data: entry.data)
        }
        .configurationDisplayName(LocalizedStringResource("widget.medium.displayName"))
        .description(LocalizedStringResource("widget.medium.description"))
        .supportedFamilies([.systemMedium])
    }
}
