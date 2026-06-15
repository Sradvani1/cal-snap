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
            Text("Daily Summary")
                .font(.headline)

            HStack {
                if differentiateWithoutColor {
                    Image(systemName: fiberIcon)
                        .foregroundStyle(fiberColor)
                }
                Text("Fiber")
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
                Text("Net calories")
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
        "\(Int(fiberConsumedG.rounded()))g / \(Int(fiberTargetG.rounded()))g"
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
        case .onTrack: "on track"
        case .moderate: "moderately low"
        case .low: "below target"
        }
        return "\(consumed) of \(target) grams fiber, \(bandDescription)"
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
        "P \(actualMacroPercents.protein)% / \(targetMacroPercents.protein)% · " +
        "C \(actualMacroPercents.carbs)% / \(targetMacroPercents.carbs)% · " +
        "F \(actualMacroPercents.fat)% / \(targetMacroPercents.fat)%"
    }

    private var macroSplitAccessibilityLabel: String {
        "Protein \(actualMacroPercents.protein) percent, target \(targetMacroPercents.protein) percent. " +
        "Carbs \(actualMacroPercents.carbs) percent, target \(targetMacroPercents.carbs) percent. " +
        "Fat \(actualMacroPercents.fat) percent, target \(targetMacroPercents.fat) percent."
    }
}
