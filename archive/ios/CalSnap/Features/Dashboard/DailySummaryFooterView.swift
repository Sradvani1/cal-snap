import SwiftUI

struct DailySummaryFooterView: View {
    let fiberConsumedG: Double
    let fiberTargetG: Double
    let fiberProgressBand: FiberProgressBand
    let netCalorieSummary: String
    let netCalorieDelta: Int
    let actualMacroPercents: (protein: Int, carbs: Int, fat: Int)
    let targetMacroPercents: (protein: Int, carbs: Int, fat: Int)

    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("dashboard.summary.title")
                .font(.headline)

            HStack {
                if differentiateWithoutColor {
                    Image(systemName: fiberIcon)
                        .foregroundStyle(fiberColor)
                }
                Text("dashboard.summary.fiber")
                    .font(.subheadline.weight(.medium))
                Spacer()
                Text(fiberSummaryText)
                    .font(.subheadline)
                    .foregroundStyle(fiberColor)
                    .accessibilityLabel(fiberAccessibilityLabel)
            }

            HStack {
                if differentiateWithoutColor {
                    Image(systemName: netCalorieIcon)
                        .foregroundStyle(netCalorieColor)
                }
                Text("dashboard.summary.netCalories")
                    .font(.subheadline.weight(.medium))
                Spacer()
                Text(netCalorieSummary)
                    .font(.subheadline)
                    .foregroundStyle(netCalorieColor)
            }

            Text(macroSplitText)
                .font(.csCaption)
                .foregroundStyle(.secondary)
                .accessibilityLabel(macroSplitAccessibilityLabel)
        }
        .sectionCard()
    }

    private var fiberSummaryText: String {
        String(
            format: String(localized: "dashboard.macroRow.consumedTarget"),
            Int(fiberConsumedG.rounded()),
            Int(fiberTargetG.rounded())
        )
    }

    private var fiberColor: Color {
        Color.fiberProgress(for: fiberProgressBand)
    }

    private var fiberIcon: String {
        switch fiberProgressBand {
        case .onTrack: "leaf.circle"
        case .moderate: "leaf.circle"
        case .low: "exclamationmark.circle"
        }
    }

    private var fiberAccessibilityLabel: String {
        let consumed = Int(fiberConsumedG.rounded())
        let target = Int(fiberTargetG.rounded())
        let bandDescription = switch fiberProgressBand {
        case .onTrack: String(localized: "dashboard.fiber.band.onTrack")
        case .moderate: String(localized: "dashboard.fiber.band.moderate")
        case .low: String(localized: "dashboard.fiber.band.low")
        }
        return String(format: String(localized: "dashboard.fiber.accessibility"), consumed, target, bandDescription)
    }

    private var netCalorieColor: Color {
        if netCalorieDelta > 0 { return Color.csDanger }
        if netCalorieDelta < 0 { return Color.csSuccess }
        return .secondary
    }

    private var netCalorieIcon: String {
        if netCalorieDelta > 0 { return "arrow.up.circle" }
        if netCalorieDelta < 0 { return "arrow.down.circle" }
        return "checkmark.circle"
    }

    private var macroSplitText: String {
        String(
            format: String(localized: "dashboard.summary.macroSplit"),
            actualMacroPercents.protein,
            targetMacroPercents.protein,
            actualMacroPercents.carbs,
            targetMacroPercents.carbs,
            actualMacroPercents.fat,
            targetMacroPercents.fat
        )
    }

    private var macroSplitAccessibilityLabel: String {
        String(
            format: String(localized: "dashboard.macroSplit.accessibility"),
            actualMacroPercents.protein,
            targetMacroPercents.protein,
            actualMacroPercents.carbs,
            targetMacroPercents.carbs,
            actualMacroPercents.fat,
            targetMacroPercents.fat
        )
    }
}
