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

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Macros")
                .font(.headline)

            macroRow(label: "Protein", consumed: proteinConsumed, target: proteinTarget, color: .blue)
            macroRow(label: "Carbs", consumed: carbsConsumed, target: carbsTarget, color: .orange)
            macroRow(label: "Fat", consumed: fatConsumed, target: fatTarget, color: .purple)

            Divider()

            macroRow(
                label: "Fiber",
                consumed: fiberConsumed,
                target: fiberTarget,
                color: .green,
                barHeight: 6
            )
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func macroRow(
        label: String,
        consumed: Double,
        target: Double,
        color: Color,
        barHeight: CGFloat = 10
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label)
                    .font(.subheadline.weight(.medium))
                Spacer()
                Text("\(Int(consumed.rounded()))g / \(Int(target.rounded()))g")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: barHeight / 2)
                        .fill(Color.secondary.opacity(0.2))
                    RoundedRectangle(cornerRadius: barHeight / 2)
                        .fill(color)
                        .frame(width: geometry.size.width * progress(consumed: consumed, target: target))
                }
            }
            .frame(height: barHeight)
        }
    }

    private func progress(consumed: Double, target: Double) -> CGFloat {
        guard target > 0 else { return 0 }
        return CGFloat(min(consumed / target, 1))
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
        fiberTarget: 28
    )
    .padding()
}
