import SwiftUI

struct GoalSetupStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    @State private var goalWeightDisplay = 72.0
    @State private var goalDateRange: ClosedRange<Date> = {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date.now)
        let minDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.minGoalDaysFromToday, to: start) ?? start
        let maxDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.maxGoalDaysFromToday, to: start) ?? start
        return minDate...maxDate
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Goals for \(viewModel.activeProfile.trimmedName)")
                .font(.title2.bold())

            Toggle("Use lbs for goal weight", isOn: viewModel.binding(\.useLbsGoalWeight))
                .onChange(of: viewModel.activeProfile.useLbsGoalWeight) { _, useLbs in
                    goalWeightDisplay = useLbs
                        ? UnitFormatters.kgToLbs(viewModel.activeProfile.goalWeightKg)
                        : viewModel.activeProfile.goalWeightKg
                }

            Stepper(
                UnitFormatters.stepperGoalWeightLabel(
                    displayValue: goalWeightDisplay,
                    useLbs: viewModel.activeProfile.useLbsGoalWeight
                ),
                value: $goalWeightDisplay,
                in: goalWeightRange,
                step: viewModel.activeProfile.useLbsGoalWeight ? 1 : 0.5
            )
            .onChange(of: goalWeightDisplay) { _, newValue in
                viewModel.updateActiveProfile { draft in
                    draft.goalWeightKg = viewModel.activeProfile.useLbsGoalWeight
                        ? UnitFormatters.lbsToKg(newValue)
                        : newValue
                }
            }

            DatePicker(
                "Target date",
                selection: viewModel.binding(\.goalTargetDate),
                in: goalDateRange,
                displayedComponents: .date
            )

            Text("Activity level")
                .font(.headline)

            ForEach(ActivityLevel.allCases, id: \.self) { level in
                Button {
                    viewModel.updateActiveProfile { $0.activityLevel = level }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: level.systemImage)
                            .frame(width: 28)
                            .foregroundStyle(.tint)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(level.rawValue)
                                .font(.subheadline.bold())
                                .foregroundStyle(.primary)
                            Text(level.description)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if viewModel.activeProfile.activityLevel == level {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.tint)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                viewModel.activeProfile.activityLevel == level ? Color.accentColor : Color.secondary.opacity(0.3),
                                lineWidth: viewModel.activeProfile.activityLevel == level ? 2 : 1
                            )
                    )
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(viewModel.activeProfile.activityLevel == level ? .isSelected : [])
            }
        }
        .task {
            goalWeightDisplay = viewModel.activeProfile.useLbsGoalWeight
                ? UnitFormatters.kgToLbs(viewModel.activeProfile.goalWeightKg)
                : viewModel.activeProfile.goalWeightKg
        }
    }

    private var goalWeightRange: ClosedRange<Double> {
        viewModel.activeProfile.useLbsGoalWeight ? 80...400 : 35...180
    }
}

#Preview {
    GoalSetupStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
