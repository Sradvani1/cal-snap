import SwiftUI

struct CalorieRingView: View {
    let consumed: Int
    let target: Int
    let remaining: Int
    let progress: Double
    let progressBand: CalorieProgressBand

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    private var ringProgress: Double {
        min(max(progress, 0), 1)
    }

    private var isOverTarget: Bool {
        progress > 1
    }

    private var progressColor: Color {
        Color.calorieProgress(for: progressBand)
    }

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 16)

                if isOverTarget {
                    Circle()
                        .stroke(progressColor.opacity(0.35), lineWidth: 20)
                }

                Circle()
                    .trim(from: 0, to: ringProgress)
                    .stroke(progressColor, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(
                        reduceMotion ? nil : .spring(response: 0.6, dampingFraction: 0.8),
                        value: ringProgress
                    )

                VStack(spacing: 4) {
                    if differentiateWithoutColor {
                        Label(bandLabel, systemImage: bandIcon)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(progressColor)
                    }
                    Text("\(abs(remaining))")
                        .font(.csLargeCalorie.monospacedDigit())
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                    Text(remaining >= 0 ? "designSystem.calorieRing.remaining" : "designSystem.calorieRing.over")
                        .font(.csCaption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 180, height: 180)
            .padding(.vertical, 8)

            Text(String(format: String(localized: "designSystem.calorieRing.ofGoal"), target))
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text(String(format: String(localized: "designSystem.calorieRing.consumed"), consumed))
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("designSystem.calorieRing.accessibility.label")
        .accessibilityValue(CalorieRingAccessibility.valueText(remaining: remaining, target: target))
    }

    private var bandLabel: String {
        switch progressBand {
        case .under: String(localized: "designSystem.calorieRing.band.under")
        case .onTrack: String(localized: "designSystem.calorieRing.band.onTrack")
        case .over: String(localized: "designSystem.calorieRing.band.over")
        }
    }

    private var bandIcon: String {
        switch progressBand {
        case .under: "arrow.down.circle"
        case .onTrack: "checkmark.circle"
        case .over: "arrow.up.circle"
        }
    }
}

#Preview("Under target") {
    CalorieRingView(
        consumed: 1200,
        target: 2000,
        remaining: 800,
        progress: 0.6,
        progressBand: .under
    )
    .padding()
}

#Preview("Over target") {
    CalorieRingView(
        consumed: 2300,
        target: 2000,
        remaining: -300,
        progress: 1.15,
        progressBand: .over
    )
    .padding()
}
