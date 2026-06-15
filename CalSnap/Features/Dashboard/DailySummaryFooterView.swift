import SwiftUI

struct DailySummaryFooterView: View {
    let fiberConsumed: Double
    let fiberTarget: Double
    let fiberColor: Color
    let netCalorieSummary: String
    let netCalorieDelta: Int
    let actualMacroPercents: (protein: Int, carbs: Int, fat: Int)
    let targetMacroPercents: (protein: Int, carbs: Int, fat: Int)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Daily Summary")
                .font(.headline)

            HStack {
                Text("Fiber")
                    .font(.subheadline.weight(.medium))
                Spacer()
                Text("\(Int(fiberConsumed.rounded()))g / \(Int(fiberTarget.rounded()))g")
                    .font(.subheadline)
                    .foregroundStyle(fiberColor)
            }

            HStack {
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

    private var macroSplitText: String {
        "P \(actualMacroPercents.protein)% / \(targetMacroPercents.protein)% · " +
        "C \(actualMacroPercents.carbs)% / \(targetMacroPercents.carbs)% · " +
        "F \(actualMacroPercents.fat)% / \(targetMacroPercents.fat)%"
    }
}

#Preview {
    DailySummaryFooterView(
        fiberConsumed: 14,
        fiberTarget: 28,
        fiberColor: .red,
        netCalorieSummary: "+300 over goal",
        netCalorieDelta: 300,
        actualMacroPercents: (28, 45, 27),
        targetMacroPercents: (30, 47, 25)
    )
    .padding()
}
