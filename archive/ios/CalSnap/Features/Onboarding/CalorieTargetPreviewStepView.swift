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
            Text("onboarding.calorieTarget.title")
                .font(.title2.bold())

            GroupBox {
                VStack(alignment: .leading, spacing: 8) {
                    summaryRow("settings.profile.tdee", value: String(format: String(localized: "units.kcalPerDay"), viewModel.calculatedTDEE))
                    summaryRow("onboarding.calorieTarget.recommendedDeficit", value: String(format: String(localized: "units.kcalPerDay"), viewModel.calculatedDeficit))
                    summaryRow("onboarding.calorieTarget.dailyTarget", value: String(format: String(localized: "units.kcalPerDay"), viewModel.calculatedTarget))
                    Divider()
                    summaryRow("designSystem.macroBar.protein", value: UnitFormatters.formatMacroGrams(viewModel.calculatedProteinG, fractionLength: 0))
                    summaryRow("designSystem.macroBar.carbs", value: UnitFormatters.formatMacroGrams(viewModel.calculatedCarbsG, fractionLength: 0))
                    summaryRow("designSystem.macroBar.fat", value: UnitFormatters.formatMacroGrams(viewModel.calculatedFatG, fractionLength: 1))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            Text("onboarding.calorieTarget.varianceNote")
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
                Text(String(format: String(localized: "onboarding.calorieTarget.dailyDeficit"), viewModel.profileDraft.requestedDeficit))
                    .font(.headline)
                Slider(
                    value: viewModel.deficitSliderBinding(),
                    in: deficitRange,
                    step: 25
                )
            }

            if !viewModel.hardDeficitUnlocked {
                Button("onboarding.calorieTarget.unlockHardDeficit") {
                    viewModel.showHardDeficitAlert = true
                }
                .font(.footnote)
            }
        }
        .task {
            viewModel.calculateTargets()
        }
        .alert("onboarding.calorieTarget.hardDeficitAlert.title", isPresented: $viewModel.showHardDeficitAlert) {
            Button("common.button.cancel", role: .cancel) {}
            Button("common.button.iUnderstand") {
                viewModel.unlockHardDeficit()
            }
        } message: {
            Text("onboarding.calorieTarget.hardDeficitAlert.message")
        }
    }

    private func summaryRow(_ label: LocalizedStringKey, value: String) -> some View {
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
