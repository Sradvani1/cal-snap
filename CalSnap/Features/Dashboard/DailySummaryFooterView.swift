import SwiftUI

struct DailySummaryFooterView: View {
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
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var netCalorieColor: Color {
        if netCalorieDelta > 0 { return .red }
        if netCalorieDelta < 0 { return .green }
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
}

#Preview {
    DailySummaryFooterView(
        netCalorieSummary: "+300 over goal",
        netCalorieDelta: 300,
        actualMacroPercents: (28, 45, 27),
        targetMacroPercents: (30, 47, 25)
    )
    .padding()
}
