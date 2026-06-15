import SwiftUI

struct ConfidenceIndicator: View {
    let level: ConfidenceLevel
    let score: Double
    let isManualEntry: Bool

    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    var body: some View {
        if isManualEntry {
            Label("Manual entry", systemImage: "hand.draw")
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(.systemGray5))
                .foregroundStyle(.secondary)
                .clipShape(Capsule())
                .accessibilityLabel("Manual entry")
        } else {
            Label {
                Text("\(level.label) (\(Int((score * 100).rounded()))%)")
            } icon: {
                Image(systemName: symbolName)
            }
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(backgroundColor)
            .foregroundStyle(foregroundColor)
            .overlay {
                if differentiateWithoutColor {
                    Capsule()
                        .strokeBorder(.primary, lineWidth: 1.5)
                }
            }
            .clipShape(Capsule())
            .accessibilityLabel("\(level.label), \(Int((score * 100).rounded())) percent")
        }
    }

    private var symbolName: String {
        switch level {
        case .high: return "checkmark.circle.fill"
        case .medium: return "questionmark.circle.fill"
        case .low: return "exclamationmark.triangle.fill"
        }
    }

    private var backgroundColor: Color {
        switch level {
        case .high: return .green.opacity(0.2)
        case .medium: return .yellow.opacity(0.25)
        case .low: return .red.opacity(0.2)
        }
    }

    private var foregroundColor: Color {
        switch level {
        case .high: return .green
        case .medium: return .orange
        case .low: return .red
        }
    }
}

#Preview("Gemini") {
    ConfidenceIndicator(level: .high, score: 0.85, isManualEntry: false)
}

#Preview("Manual") {
    ConfidenceIndicator(level: .low, score: 0, isManualEntry: true)
}
