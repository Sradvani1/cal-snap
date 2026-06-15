import SwiftUI

struct CalorieRingCard: View {
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
        switch progressBand {
        case .under: .green
        case .onTrack: .yellow
        case .over: .red
        }
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
                        .font(.largeTitle.bold().monospacedDigit())
                    Text(remaining >= 0 ? "remaining" : "over")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 180, height: 180)
            .padding(.vertical, 8)

            Text("of \(target) kcal goal")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text("\(consumed) kcal consumed")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Calorie progress")
        .accessibilityValue(accessibilityValueText)
    }

    private var bandLabel: String {
        switch progressBand {
        case .under: "Under goal"
        case .onTrack: "On track"
        case .over: "Over goal"
        }
    }

    private var bandIcon: String {
        switch progressBand {
        case .under: "arrow.down.circle"
        case .onTrack: "checkmark.circle"
        case .over: "arrow.up.circle"
        }
    }

    private var accessibilityValueText: String {
        if remaining >= 0 {
            return "\(remaining) calories remaining of \(target) goal"
        }
        return "\(-remaining) calories over \(target) goal"
    }
}

#Preview("Under target") {
    CalorieRingCard(
        consumed: 1200,
        target: 2000,
        remaining: 800,
        progress: 0.6,
        progressBand: .under
    )
    .padding()
}

#Preview("Over target") {
    CalorieRingCard(
        consumed: 2300,
        target: 2000,
        remaining: -300,
        progress: 1.15,
        progressBand: .over
    )
    .padding()
}
