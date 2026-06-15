import SwiftUI

struct ConfidenceBadge: View {
    let level: ConfidenceLevel
    let score: Double
    let isManualEntry: Bool

    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    var body: some View {
        if isManualEntry {
            Label("Manual entry", systemImage: "hand.draw")
                .font(.csCaption.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.secondary.opacity(0.15))
                .foregroundStyle(.secondary)
                .clipShape(Capsule())
                .accessibilityLabel("Manual entry")
        } else {
            Label {
                Text("\(level.label) (\(Int((score * 100).rounded()))%)")
            } icon: {
                Image(systemName: symbolName)
            }
            .font(.csCaption.weight(.semibold))
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
        case .high: "checkmark.circle.fill"
        case .medium: "questionmark.circle.fill"
        case .low: "exclamationmark.triangle.fill"
        }
    }

    private var backgroundColor: Color {
        switch level {
        case .high: Color.csSuccess.opacity(0.2)
        case .medium: Color.csWarning.opacity(0.25)
        case .low: Color.csDanger.opacity(0.2)
        }
    }

    private var foregroundColor: Color {
        switch level {
        case .high: Color.csSuccess
        case .medium: Color.csAccent
        case .low: Color.csDanger
        }
    }
}

#Preview("Gemini") {
    ConfidenceBadge(level: .high, score: 0.85, isManualEntry: false)
}

#Preview("Manual") {
    ConfidenceBadge(level: .low, score: 0, isManualEntry: true)
}
