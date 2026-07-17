import SwiftUI

struct OnboardingStepContent: View {
    @Bindable var viewModel: OnboardingViewModel

    var body: some View {
        VStack(spacing: 0) {
            ProgressView(value: viewModel.progress)
                .padding(.horizontal)
                .padding(.top, 8)

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    switch viewModel.currentStep {
                    case .welcome:
                        WelcomeStepView()
                    case .profileSetup:
                        ProfileSetupStepView(viewModel: viewModel)
                    case .goalSetup:
                        GoalSetupStepView(viewModel: viewModel)
                    case .caloriePreview:
                        CalorieTargetPreviewStepView(viewModel: viewModel)
                    case .healthKit:
                        HealthKitPermissionStepView(viewModel: viewModel)
                    case .apiKeys:
                        APIKeySetupStepView(viewModel: viewModel)
                    case .done:
                        OnboardingDoneStepView()
                    }
                }
                .padding()
            }

            if let error = viewModel.validationError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }
        }
    }
}
