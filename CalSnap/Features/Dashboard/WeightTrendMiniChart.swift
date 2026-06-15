import Charts
import SwiftUI

struct WeightTrendMiniChart: View {
    let weighIns: [WeighIn]
    let startingWeightKg: Double
    let useLbs: Bool
    var onTap: () -> Void = {}
    var onLogWeighIn: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Weight Trend")
                    .font(.headline)
                Spacer()
                Button("Log weigh-in", action: onLogWeighIn)
                    .font(.caption.weight(.semibold))
            }

            if weighIns.count >= 2 {
                Button(action: onTap) {
                    WeightTrendMiniChartChart(weighIns: weighIns, useLbs: useLbs)
                }
                .buttonStyle(.plain)
                .accessibilityHint("Opens weight progress")
                .accessibilityLabel(miniChartAccessibilityLabel)
            } else {
                WeightTrendMiniChartEmptyState(
                    startingWeightKg: startingWeightKg,
                    useLbs: useLbs,
                    onLogWeighIn: onLogWeighIn
                )
            }
        }
        .sectionCard()
    }

    private var miniChartAccessibilityLabel: String {
        guard let latest = weighIns.max(by: { $0.date < $1.date }) else {
            return "Weight trend, starting weight \(UnitFormatters.formatWeight(kg: startingWeightKg, useLbs: useLbs))"
        }

        let current = UnitFormatters.formatWeight(kg: latest.weightKg, useLbs: useLbs)
        if weighIns.count >= 2,
           let earliest = weighIns.min(by: { $0.date < $1.date }) {
            let delta = latest.weightKg - earliest.weightKg
            if delta < -0.1 {
                return "Weight trend, current \(current), trending down"
            }
            if delta > 0.1 {
                return "Weight trend, current \(current), trending up"
            }
        }
        return "Weight trend, current \(current)"
    }
}

struct WeightTrendMiniChartChart: View {
    let weighIns: [WeighIn]
    let useLbs: Bool

    var body: some View {
        Chart(weighIns, id: \.id) { weighIn in
            LineMark(
                x: .value("Date", weighIn.date),
                y: .value("Weight", displayWeight(weighIn.weightKg))
            )
            .foregroundStyle(Color.csPrimary)
            PointMark(
                x: .value("Date", weighIn.date),
                y: .value("Weight", displayWeight(weighIn.weightKg))
            )
            .foregroundStyle(Color.csPrimary)
        }
        .chartYAxisLabel(useLbs ? "lbs" : "kg")
        .frame(height: 120)
        .frame(maxWidth: .infinity)
    }

    private func displayWeight(_ kg: Double) -> Double {
        useLbs ? UnitFormatters.kgToLbs(kg) : kg
    }
}

struct WeightTrendMiniChartEmptyState: View {
    let startingWeightKg: Double
    let useLbs: Bool
    let onLogWeighIn: () -> Void

    var body: some View {
        EmptyStateView(
            icon: "scalemass",
            title: UnitFormatters.formatWeight(kg: startingWeightKg, useLbs: useLbs),
            message: "Your weight trend will appear after weekly weigh-ins.",
            actionTitle: "Log your first weigh-in",
            action: onLogWeighIn
        )
    }
}

#Preview("Empty state") {
    WeightTrendMiniChart(
        weighIns: [],
        startingWeightKg: 80,
        useLbs: false
    )
    .padding()
}

#Preview("Chart") {
    let userId = UUID()
    let calendar = Calendar.current
    WeightTrendMiniChart(
        weighIns: [
            WeighIn(userId: userId, date: calendar.date(byAdding: .day, value: -4, to: Date.now)!, weightKg: 81),
            WeighIn(userId: userId, date: calendar.date(byAdding: .day, value: -2, to: Date.now)!, weightKg: 80.5),
            WeighIn(userId: userId, date: Date.now, weightKg: 80.2),
        ],
        startingWeightKg: 81,
        useLbs: false
    )
    .padding()
}
