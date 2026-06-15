import SwiftUI

struct CalorieRingCard: View {
    let consumed: Int
    let target: Int
    let remaining: Int
    let progress: Double
    let progressColor: Color

    private var ringProgress: Double {
        min(max(progress, 0), 1)
    }

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 16)
                Circle()
                    .trim(from: 0, to: ringProgress)
                    .stroke(progressColor, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: ringProgress)

                VStack(spacing: 4) {
                    Text("\(remaining)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
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
        progressColor: .green
    )
    .padding()
}

#Preview("Over target") {
    CalorieRingCard(
        consumed: 2300,
        target: 2000,
        remaining: -300,
        progress: 1.15,
        progressColor: .red
    )
    .padding()
}
