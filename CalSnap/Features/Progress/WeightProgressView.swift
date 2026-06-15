import Charts
import SwiftUI
import SwiftData

struct WeightProgressView: View {
    @Environment(\.modelContext) private var modelContext
    @Bindable var viewModel: WeightProgressViewModel
    @Binding var showWeighInSheet: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let error = viewModel.loadError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                headerStats
                progressBar
                weightChart
                statsGrid
                historySection
            }
            .padding()
        }
        .navigationTitle("Weight Progress")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Log weigh-in") {
                    showWeighInSheet = true
                }
            }
        }
        .task {
            viewModel.load(context: modelContext)
        }
        .onChange(of: showWeighInSheet) { _, isShowing in
            if !isShowing {
                viewModel.load(context: modelContext)
            }
        }
    }

    private var headerStats: some View {
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

    private var progressBar: some View {
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
                }
            }
            .frame(height: 10)
        }
    }

    private var weightChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weight trend")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Your weight trend will appear after weekly weigh-ins")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button("Log your first weigh-in") {
                        showWeighInSheet = true
                    }
                    .font(.subheadline.weight(.semibold))
                }
            } else {
                Chart {
                    let actualWeighIns = viewModel.weighIns.reversed()
                    if actualWeighIns.count >= 2 {
                        ForEach(actualWeighIns, id: \.id) { weighIn in
                            LineMark(
                                x: .value("Date", weighIn.date),
                                y: .value("Weight", displayWeight(weighIn.weightKg))
                            )
                            .foregroundStyle(Color.accentColor)
                        }
                    }
                    ForEach(actualWeighIns, id: \.id) { weighIn in
                        PointMark(
                            x: .value("Date", weighIn.date),
                            y: .value("Weight", displayWeight(weighIn.weightKg))
                        )
                        .foregroundStyle(Color.accentColor)
                    }

                    ForEach(Array(viewModel.projectionPoints.enumerated()), id: \.offset) { _, point in
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
                }
                .chartYAxisLabel(viewModel.useLbs ? "lbs" : "kg")
                .frame(height: 220)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var statsGrid: some View {
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

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weigh-in history")
                .font(.headline)

            if viewModel.weighIns.isEmpty {
                Text("No weigh-ins yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(viewModel.weighIns, id: \.id) { weighIn in
                    HStack {
                        Text(weighIn.date.formatted(date: .abbreviated, time: .omitted))
                        Spacer()
                        Text(viewModel.formatWeight(weighIn.weightKg))
                            .fontWeight(.medium)
                    }
                    .font(.subheadline)
                }
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
            showWeighInSheet: .constant(false)
        )
    }
}
