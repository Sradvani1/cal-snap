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

            Button(action: onTap) {
                chartContent
            }
            .buttonStyle(.plain)
            .accessibilityHint("Opens weight progress")
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private var chartContent: some View {
        if weighIns.count >= 2 {
            Chart(weighIns, id: \.id) { weighIn in
                LineMark(
                    x: .value("Date", weighIn.date),
                    y: .value("Weight", displayWeight(weighIn.weightKg))
                )
                PointMark(
                    x: .value("Date", weighIn.date),
                    y: .value("Weight", displayWeight(weighIn.weightKg))
                )
            }
            .chartYAxisLabel(useLbs ? "lbs" : "kg")
            .frame(height: 120)
            .frame(maxWidth: .infinity)
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Text(UnitFormatters.formatWeight(kg: startingWeightKg, useLbs: useLbs))
                    .font(.title3.weight(.semibold))
                Text("Your weight trend will appear after weekly weigh-ins")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 8)
        }
    }

    private func displayWeight(_ kg: Double) -> Double {
        useLbs ? UnitFormatters.kgToLbs(kg) : kg
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
