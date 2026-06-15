import SwiftUI

struct MacroBarRow: View {
    let label: String
    let consumed: Double
    let target: Double
    let color: Color
    var barHeight: CGFloat = 10
    var progressBand: FiberProgressBand?

    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    private var progress: CGFloat {
        guard target > 0 else { return 0 }
        return CGFloat(min(consumed / target, 1))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                if differentiateWithoutColor, let progressBand {
                    Image(systemName: bandIcon(for: progressBand))
                        .foregroundStyle(color)
                        .font(.caption)
                }
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
                        .frame(width: geometry.size.width * progress)
                }
            }
            .frame(height: barHeight)
        }
    }

    private func bandIcon(for band: FiberProgressBand) -> String {
        switch band {
        case .onTrack: "checkmark.circle"
        case .moderate: "minus.circle"
        case .low: "exclamationmark.circle"
        }
    }
}

#Preview {
    MacroBarRow(
        label: "Protein",
        consumed: 90,
        target: 140,
        color: .blue
    )
    .padding()
}
