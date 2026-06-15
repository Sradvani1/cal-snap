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
                    .foregroundStyle(Color.csDanger)
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
            NutrientStatRow(label: "Current", value: viewModel.formatWeight(viewModel.currentWeightKg))
            Divider()
            NutrientStatRow(label: "Start", value: viewModel.formatWeight(viewModel.profile.startingWeightKg))
            Divider()
            NutrientStatRow(label: "Goal", value: viewModel.formatWeight(viewModel.profile.goalWeightKg))
        }
        .sectionCard()
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
                        .fill(Color.secondary.opacity(0.25))
                    Capsule()
                        .fill(Color.csPrimary)
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

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showChart = false
    @State private var suppressCountAnimation = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weight trend")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                EmptyStateView(
                    icon: "scalemass",
                    title: "No weigh-ins yet",
                    message: "Your weight trend will appear after weekly weigh-ins.",
                    actionTitle: "Log your first weigh-in",
                    action: onLogWeighIn
                )
            } else {
                Chart {
                    if viewModel.chartWeighInsAscending.count >= 2 {
                        ForEach(viewModel.chartWeighInsAscending, id: \.id) { weighIn in
                            LineMark(
                                x: .value("Date", weighIn.date),
                                y: .value("Weight", displayWeight(weighIn.weightKg))
                            )
                            .foregroundStyle(Color.csPrimary)
                        }
                    }
                    ForEach(viewModel.chartWeighInsAscending, id: \.id) { weighIn in
                        PointMark(
                            x: .value("Date", weighIn.date),
                            y: .value("Weight", displayWeight(weighIn.weightKg))
                        )
                        .foregroundStyle(Color.csPrimary)
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
                        .foregroundStyle(Color.csSuccess)
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        .accessibilityHidden(true)
                }
                .chartYAxisLabel(viewModel.useLbs ? "lbs" : "kg")
                .frame(height: 220)
                .opacity(showChart ? 1 : 0)
                .animation(reduceMotion ? nil : .default, value: showChart)
                .animation(reduceMotion || suppressCountAnimation ? nil : .default, value: viewModel.chartWeighInsAscending.count)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(viewModel.chartAccessibilitySummary)
                .onAppear {
                    if reduceMotion {
                        showChart = true
                        suppressCountAnimation = true
                    } else {
                        showChart = true
                        Task { @MainActor in
                            try? await Task.sleep(for: .milliseconds(400))
                            suppressCountAnimation = true
                        }
                    }
                }
            }
        }
        .sectionCard()
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
        NutrientStatRow(label: title, value: value)
            .sectionCard(cornerRadius: 12)
    }
}

struct WeightProgressHistoryView: View {
    let viewModel: WeightProgressViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weigh-in history")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                EmptyStateView(
                    icon: "list.bullet",
                    title: "No history",
                    message: "Weigh-in history will appear here after you log your first weigh-in."
                )
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
        .sectionCard()
    }
}

#Preview {
    NavigationStack {
        WeightProgressView(
            viewModel: WeightProgressViewModel(
                profile: UserProfile(
                    name: "",
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
