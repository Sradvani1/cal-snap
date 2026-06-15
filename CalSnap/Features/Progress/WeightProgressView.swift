import Charts
import SwiftUI
import SwiftData

enum WeightProgressPresentation {
    case navigationStack
    case embedded
}

struct WeightProgressView: View {
    @Environment(\.modelContext) private var modelContext
    var presentation: WeightProgressPresentation = .navigationStack
    @Bindable var viewModel: WeightProgressViewModel
    var onLogWeighIn: () -> Void
    var reloadTrigger: Int

    var body: some View {
        Group {
            switch presentation {
            case .navigationStack:
                ScrollView {
                    weightProgressContent
                }
                .navigationTitle("Weight Progress")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Log weigh-in", action: onLogWeighIn)
                    }
                }
            case .embedded:
                weightProgressContent
            }
        }
        .task(id: reloadTrigger) {
            viewModel.load(context: modelContext)
        }
    }

    private var weightProgressContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            if let error = viewModel.loadError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            WeightProgressHeaderView(viewModel: viewModel)
            WeightProgressBarView(viewModel: viewModel)
            WeightProgressChartView(viewModel: viewModel, onLogWeighIn: onLogWeighIn)
            WeightProgressStatsGridView(viewModel: viewModel)
            WeightProgressHistoryView(viewModel: viewModel)
        }
        .padding(presentation == .embedded ? 0 : 16)
    }
}

struct WeightProgressHeaderView: View {
    let viewModel: WeightProgressViewModel

    var body: some View {
        HStack {
            statColumn(title: "Current", value: viewModel.formatWeight(viewModel.currentWeightKg))
            Divider()
            statColumn(title: "Start", value: viewModel.formatWeight(viewModel.profile.startingWeightKg))
            Divider()
            statColumn(title: "Goal", value: viewModel.formatWeight(viewModel.profile.goalWeightKg))
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func statColumn(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
        }
        .frame(maxWidth: .infinity)
    }
}

struct WeightProgressBarView: View {
    let viewModel: WeightProgressViewModel

    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Progress to goal")
                .font(.subheadline.weight(.semibold))
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color(.tertiarySystemFill))
                    Capsule()
                        .fill(Color.accentColor)
                        .frame(width: geometry.size.width * viewModel.progressFraction)
                    if differentiateWithoutColor {
                        Capsule()
                            .strokeBorder(Color.primary.opacity(0.35), lineWidth: 1)
                    }
                }
            }
            .frame(height: 10)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Progress to goal")
        .accessibilityValue(viewModel.progressAccessibilityValue)
    }
}

struct WeightProgressChartView: View {
    let viewModel: WeightProgressViewModel
    let onLogWeighIn: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weight trend")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Your weight trend will appear after weekly weigh-ins")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button("Log your first weigh-in", action: onLogWeighIn)
                        .font(.subheadline.weight(.semibold))
                }
            } else {
                Chart {
                    if viewModel.chartWeighInsAscending.count >= 2 {
                        ForEach(viewModel.chartWeighInsAscending, id: \.id) { weighIn in
                            LineMark(
                                x: .value("Date", weighIn.date),
                                y: .value("Weight", displayWeight(weighIn.weightKg))
                            )
                            .foregroundStyle(Color.accentColor)
                        }
                    }
                    ForEach(viewModel.chartWeighInsAscending, id: \.id) { weighIn in
                        PointMark(
                            x: .value("Date", weighIn.date),
                            y: .value("Weight", displayWeight(weighIn.weightKg))
                        )
                        .foregroundStyle(Color.accentColor)
                    }

                    ForEach(viewModel.projectionPoints) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Weight", displayWeight(point.weightKg))
                        )
                        .foregroundStyle(.secondary)
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [6, 4]))
                    }

                    RuleMark(y: .value("Goal", displayWeight(viewModel.profile.goalWeightKg)))
                        .foregroundStyle(.green)
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        .accessibilityHidden(true)
                }
                .chartYAxisLabel(viewModel.useLbs ? "lbs" : "kg")
                .frame(height: 220)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(viewModel.chartAccessibilitySummary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func displayWeight(_ kg: Double) -> Double {
        viewModel.useLbs ? UnitFormatters.kgToLbs(kg) : kg
    }
}

struct WeightProgressStatsGridView: View {
    let viewModel: WeightProgressViewModel

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(title: "Lost so far", value: viewModel.formatWeight(viewModel.lostSoFarKg))
            statCard(title: "To goal", value: viewModel.formatWeight(viewModel.toGoalKg))
            statCard(title: "Rate", value: viewModel.formatWeeklyRate())
            statCard(title: "Projected goal", value: viewModel.formatProjectedGoalDate())
        }
    }

    private func statCard(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct WeightProgressHistoryView: View {
    let viewModel: WeightProgressViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weigh-in history")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                Text("No weigh-ins yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.weighIns, id: \.id) { weighIn in
                        HStack {
                            Text(weighIn.date.formatted(date: .abbreviated, time: .omitted))
                            Spacer()
                            Text(viewModel.formatWeight(weighIn.weightKg))
                                .fontWeight(.medium)
                        }
                        .font(.subheadline)
                        .padding(.vertical, 6)
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel(
                            "\(weighIn.date.formatted(date: .abbreviated, time: .omitted)), \(viewModel.formatWeight(weighIn.weightKg))"
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    NavigationStack {
        WeightProgressView(
            viewModel: WeightProgressViewModel(
                profile: UserProfile(
                    name: "Alex",
                    startingWeightKg: 85,
                    goalWeightKg: 72,
                    dailyCalorieTarget: 2000,
                    tdee: 2350,
                    deficitKcal: 350
                ),
                useLbs: false,
                weighInRepository: WeighInRepository()
            ),
            onLogWeighIn: {},
            reloadTrigger: 0
        )
    }
}
