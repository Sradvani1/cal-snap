import SwiftUI

struct CalorieTargetPreviewStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    private var deficitRange: ClosedRange<Double> {
        let upper = viewModel.hardDeficitUnlocked
            ? Double(AppConstants.Deficit.hardMaxDeficitKcal)
            : Double(AppConstants.Deficit.maxDeficitKcal)
        return Double(AppConstants.Deficit.minDeficitKcal)...upper
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Your calorie target")
                .font(.title2.bold())

            GroupBox {
                VStack(alignment: .leading, spacing: 8) {
                    summaryRow("TDEE", value: "\(viewModel.calculatedTDEE) kcal/day")
                    summaryRow("Recommended deficit", value: "\(viewModel.calculatedDeficit) kcal/day")
                    summaryRow("Daily calorie target", value: "\(viewModel.calculatedTarget) kcal/day")
                    Divider()
                    summaryRow("Protein", value: UnitFormatters.formatMacroGrams(viewModel.calculatedProteinG, fractionLength: 0))
                    summaryRow("Carbs", value: UnitFormatters.formatMacroGrams(viewModel.calculatedCarbsG, fractionLength: 0))
                    summaryRow("Fat", value: UnitFormatters.formatMacroGrams(viewModel.calculatedFatG, fractionLength: 1))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            Text("This estimate has a natural ±15% variance. Your real number reveals itself over 2–3 weeks of tracking.")
                .font(.footnote)
                .foregroundStyle(.secondary)

            if !viewModel.warnings.isEmpty {
                ForEach(viewModel.warnings, id: \.self) { warning in
                    Text(warning)
                        .font(.footnote)
                        .foregroundStyle(.orange)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Daily deficit: \(viewModel.profileDraft.requestedDeficit) kcal")
                    .font(.headline)
                Slider(
                    value: viewModel.deficitSliderBinding(),
                    in: deficitRange,
                    step: 25
                )
            }

            if !viewModel.hardDeficitUnlocked {
                Button("Unlock up to 750 kcal/day") {
                    viewModel.showHardDeficitAlert = true
                }
                .font(.footnote)
            }
        }
        .task {
            viewModel.calculateTargets()
        }
        .alert("Higher deficit warning", isPresented: $viewModel.showHardDeficitAlert) {
            Button("Cancel", role: .cancel) {}
            Button("I understand") {
                viewModel.unlockHardDeficit()
            }
        } message: {
            Text("Deficits above 500 kcal/day can trigger metabolic adaptation. Proceed only if you understand the tradeoff.")
        }
    }

    private func summaryRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
        }
        .font(.subheadline)
    }
}

#Preview {
    CalorieTargetPreviewStepView(viewModel: {
        let vm = OnboardingViewModel(
            healthKitService: HealthKitService(),
            geminiService: GeminiService(),
            userProfileRepository: UserProfileRepository()
        )
        vm.calculateTargets()
        return vm
    }())
}
