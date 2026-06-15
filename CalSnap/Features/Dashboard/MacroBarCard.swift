import SwiftUI

struct MacroBarCard: View {
    let proteinConsumed: Double
    let proteinTarget: Double
    let carbsConsumed: Double
    let carbsTarget: Double
    let fatConsumed: Double
    let fatTarget: Double
    let fiberConsumed: Double
    let fiberTarget: Double
    let fiberProgressBand: FiberProgressBand

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Macros")
                .font(.headline)

            MacroBarRow(
                label: "Protein",
                consumed: proteinConsumed,
                target: proteinTarget,
                color: .blue
            )
            MacroBarRow(
                label: "Carbs",
                consumed: carbsConsumed,
                target: carbsTarget,
                color: .orange
            )
            MacroBarRow(
                label: "Fat",
                consumed: fatConsumed,
                target: fatTarget,
                color: .purple
            )

            Divider()

            MacroBarRow(
                label: "Fiber",
                consumed: fiberConsumed,
                target: fiberTarget,
                color: fiberColor,
                barHeight: 6,
                progressBand: fiberProgressBand
            )
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var fiberColor: Color {
        switch fiberProgressBand {
        case .onTrack: .green
        case .moderate: .yellow
        case .low: .red
        }
    }
}

#Preview {
    MacroBarCard(
        proteinConsumed: 90,
        proteinTarget: 140,
        carbsConsumed: 120,
        carbsTarget: 235,
        fatConsumed: 40,
        fatTarget: 56,
        fiberConsumed: 12,
        fiberTarget: 28,
        fiberProgressBand: .low
    )
    .padding()
}
