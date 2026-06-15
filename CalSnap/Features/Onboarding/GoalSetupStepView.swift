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
            Text("onboarding.goals.title")
                .font(.title2.bold())

            Toggle("onboarding.goals.useLbsGoalWeight", isOn: viewModel.binding(\.useLbsGoalWeight))
                .onChange(of: viewModel.profileDraft.useLbsGoalWeight) { _, useLbs in
                    goalWeightDisplay = useLbs
                        ? UnitFormatters.kgToLbs(viewModel.profileDraft.goalWeightKg)
                        : viewModel.profileDraft.goalWeightKg
                }

            Stepper(
                UnitFormatters.stepperGoalWeightLabel(
                    displayValue: goalWeightDisplay,
                    useLbs: viewModel.profileDraft.useLbsGoalWeight
                ),
                value: $goalWeightDisplay,
                in: goalWeightRange,
                step: viewModel.profileDraft.useLbsGoalWeight ? 1 : 0.5
            )
            .onChange(of: goalWeightDisplay) { _, newValue in
                viewModel.updateProfileDraft { draft in
                    draft.goalWeightKg = viewModel.profileDraft.useLbsGoalWeight
                        ? UnitFormatters.lbsToKg(newValue)
                        : newValue
                }
            }

            DatePicker(
                "onboarding.goals.targetDate",
                selection: viewModel.binding(\.goalTargetDate),
                in: goalDateRange,
                displayedComponents: .date
            )

            Text("settings.profile.activityLevel")
                .font(.headline)

            ForEach(ActivityLevel.allCases, id: \.self) { level in
                Button {
                    viewModel.updateProfileDraft { $0.activityLevel = level }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: level.systemImage)
                            .frame(width: 28)
                            .foregroundStyle(.tint)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(level.localizedTitle)
                                .font(.subheadline.bold())
                                .foregroundStyle(.primary)
                            Text(level.description)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if viewModel.profileDraft.activityLevel == level {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.tint)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                viewModel.profileDraft.activityLevel == level ? Color.accentColor : Color.secondary.opacity(0.3),
                                lineWidth: viewModel.profileDraft.activityLevel == level ? 2 : 1
                            )
                    )
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(viewModel.profileDraft.activityLevel == level ? .isSelected : [])
            }
        }
        .task {
            goalWeightDisplay = viewModel.profileDraft.useLbsGoalWeight
                ? UnitFormatters.kgToLbs(viewModel.profileDraft.goalWeightKg)
                : viewModel.profileDraft.goalWeightKg
        }
    }

    private var goalWeightRange: ClosedRange<Double> {
        viewModel.profileDraft.useLbsGoalWeight ? 80...400 : 35...180
    }
}

#Preview {
    GoalSetupStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
