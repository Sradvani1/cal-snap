import SwiftUI

struct GoalSetupStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    @State private var goalWeightDisplay = 72.0
    @State private var goalDateRange: ClosedRange<Date> = {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        let minDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.minGoalDaysFromToday, to: start) ?? start
        let maxDate = calendar.date(byAdding: .day, value: AppConstants.Onboarding.maxGoalDaysFromToday, to: start) ?? start
        return minDate...maxDate
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Goals for \(viewModel.activeProfile.trimmedName)")
                .font(.title2.bold())

            Toggle("Use lbs for goal weight", isOn: $viewModel.useLbsGoalWeight)
                .onChange(of: viewModel.useLbsGoalWeight) { _, useLbs in
                    goalWeightDisplay = useLbs
                        ? UnitFormatters.kgToLbs(viewModel.activeProfile.goalWeightKg)
                        : viewModel.activeProfile.goalWeightKg
                }

            Stepper(goalWeightLabel, value: $goalWeightDisplay, in: goalWeightRange, step: viewModel.useLbsGoalWeight ? 1 : 0.5)
                .onChange(of: goalWeightDisplay) { _, newValue in
                    var draft = viewModel.activeProfile
                    draft.goalWeightKg = viewModel.useLbsGoalWeight
                        ? UnitFormatters.lbsToKg(newValue)
                        : newValue
                    viewModel.activeProfile = draft
                }

            DatePicker(
                "Target date",
                selection: goalDateBinding,
                in: goalDateRange,
                displayedComponents: .date
            )

            Text("Activity level")
                .font(.headline)

            ForEach(ActivityLevel.allCases, id: \.self) { level in
                Button {
                    var draft = viewModel.activeProfile
                    draft.activityLevel = level
                    viewModel.activeProfile = draft
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
            }
        }
        .onAppear {
            goalWeightDisplay = viewModel.useLbsGoalWeight
                ? UnitFormatters.kgToLbs(viewModel.activeProfile.goalWeightKg)
                : viewModel.activeProfile.goalWeightKg
        }
    }

    private var goalDateBinding: Binding<Date> {
        Binding(
            get: { viewModel.activeProfile.goalTargetDate },
            set: { newValue in
                var draft = viewModel.activeProfile
                draft.goalTargetDate = newValue
                viewModel.activeProfile = draft
            }
        )
    }

    private var goalWeightLabel: String {
        if viewModel.useLbsGoalWeight {
            return String(format: "Goal weight: %.0f lbs", goalWeightDisplay)
        }
        return String(format: "Goal weight: %.1f kg", goalWeightDisplay)
    }

    private var goalWeightRange: ClosedRange<Double> {
        viewModel.useLbsGoalWeight ? 80...400 : 35...180
    }
}

#Preview {
    GoalSetupStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
