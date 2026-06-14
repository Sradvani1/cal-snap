import SwiftUI
import SwiftData

struct OnboardingView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: OnboardingViewModel?

    var body: some View {
        Group {
            if let viewModel {
                onboardingContent(viewModel: viewModel)
            } else {
                ProgressView()
            }
        }
        .onAppear {
            if viewModel == nil {
                viewModel = OnboardingViewModel(
                    healthKitService: appContainer.healthKitService,
                    geminiService: appContainer.geminiService,
                    userProfileRepository: appContainer.userProfileRepository
                )
            }
        }
    }

    @ViewBuilder
    private func onboardingContent(viewModel: OnboardingViewModel) -> some View {
        VStack(spacing: 0) {
            ProgressView(value: viewModel.progress)
                .padding(.horizontal)
                .padding(.top, 8)

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    switch viewModel.currentStep {
                    case .welcome:
                        WelcomeStepView(viewModel: viewModel)
                    case .profileSetup:
                        ProfileSetupStepView(viewModel: viewModel)
                            .id("profileSetup-\(viewModel.currentProfileIndex)")
                    case .goalSetup:
                        GoalSetupStepView(viewModel: viewModel)
                            .id("goalSetup-\(viewModel.currentProfileIndex)")
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

            navigationBar(viewModel: viewModel)
        }
        .navigationBarBackButtonHidden(true)
    }

    @ViewBuilder
    private func navigationBar(viewModel: OnboardingViewModel) -> some View {
        HStack {
            if viewModel.currentStep != .welcome && viewModel.currentStep != .done {
                Button("Back") {
                    viewModel.goBack()
                }
            }

            Spacer()

            if viewModel.currentStep == .healthKit {
                Button("Continue") {
                    viewModel.requestHealthKit()
                    tryAdvance(viewModel: viewModel)
                }
                .buttonStyle(.borderedProminent)
            } else if viewModel.currentStep == .apiKeys {
                Button("Continue") {
                    tryAdvance(viewModel: viewModel)
                }
                .buttonStyle(.borderedProminent)
            } else if viewModel.currentStep != .done {
                Button("Continue") {
                    tryAdvance(viewModel: viewModel)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }

    private func tryAdvance(viewModel: OnboardingViewModel) {
        do {
            try viewModel.advance(context: modelContext)
        } catch {
            viewModel.validationError = error.localizedDescription
        }
    }
}

#Preview {
    OnboardingView()
        .environment(AppContainer())
        .modelContainer(for: UserProfile.self, inMemory: true)
}
