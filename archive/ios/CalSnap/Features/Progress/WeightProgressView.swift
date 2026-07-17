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
                .navigationTitle("progress.title")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("progress.logWeighIn", action: onLogWeighIn)
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
            NutrientStatRow(label: String(localized: "progress.stats.current"), value: viewModel.formatWeight(viewModel.currentWeightKg))
            Divider()
            NutrientStatRow(label: String(localized: "progress.stats.start"), value: viewModel.formatWeight(viewModel.profile.startingWeightKg))
            Divider()
            NutrientStatRow(label: String(localized: "progress.stats.goal"), value: viewModel.formatWeight(viewModel.profile.goalWeightKg))
        }
        .sectionCard()
    }
}

struct WeightProgressBarView: View {
    let viewModel: WeightProgressViewModel

    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("progress.progressBar.title")
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
        .accessibilityLabel("progress.progressBar.title")
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
            Text("progress.chart.title")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                EmptyStateView(
                    icon: "scalemass",
                    title: String(localized: "progress.chart.empty.title"),
                    message: String(localized: "progress.chart.empty.message"),
                    actionTitle: String(localized: "progress.chart.empty.action"),
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
                .chartYAxisLabel(viewModel.useLbs ? String(localized: "units.lbs") : String(localized: "units.kg"))
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
            statCard(title: String(localized: "progress.stats.lostSoFar"), value: viewModel.formatWeight(viewModel.lostSoFarKg))
            statCard(title: String(localized: "progress.stats.toGoal"), value: viewModel.formatWeight(viewModel.toGoalKg))
            statCard(title: String(localized: "progress.stats.rate"), value: viewModel.formatWeeklyRate())
            statCard(title: String(localized: "progress.stats.projectedGoal"), value: viewModel.formatProjectedGoalDate())
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
            Text("progress.history.title")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                EmptyStateView(
                    icon: "list.bullet",
                    title: String(localized: "progress.history.empty.title"),
                    message: String(localized: "progress.history.empty.message")
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
                            String(format: String(localized: "progress.history.accessibility"), weighIn.date.formatted(date: .abbreviated, time: .omitted), viewModel.formatWeight(weighIn.weightKg))
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
