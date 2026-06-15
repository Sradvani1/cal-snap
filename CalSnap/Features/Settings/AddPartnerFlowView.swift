import SwiftData
import SwiftUI

private enum AddPartnerStep: Int, CaseIterable {
    case profileSetup
    case goalSetup
    case caloriePreview
}

struct AddPartnerFlowView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let onPartnerAdded: () -> Void

    @State private var viewModel: OnboardingViewModel?
    @State private var step: AddPartnerStep = .profileSetup

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            switch step {
                            case .profileSetup:
                                ProfileSetupStepView(viewModel: viewModel)
                            case .goalSetup:
                                GoalSetupStepView(viewModel: viewModel)
                            case .caloriePreview:
                                CalorieTargetPreviewStepView(viewModel: viewModel)
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

                    partnerNavigationBar(viewModel: viewModel)
                } else {
                    ProgressView()
                }
            }
            .navigationTitle("Add Partner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .presentationSizing(.form)
        .task {
            if viewModel == nil {
                let vm = OnboardingViewModel(
                    healthKitService: appContainer.healthKitService,
                    geminiService: appContainer.geminiService,
                    userProfileRepository: appContainer.userProfileRepository
                )
                vm.currentProfileIndex = 1
                vm.currentStep = .profileSetup
                viewModel = vm
            }
        }
    }

    @ViewBuilder
    private func partnerNavigationBar(viewModel: OnboardingViewModel) -> some View {
        HStack {
            if step != .profileSetup {
                Button("Back") {
                    viewModel.validationError = nil
                    switch step {
                    case .goalSetup:
                        step = .profileSetup
                    case .caloriePreview:
                        step = .goalSetup
                    case .profileSetup:
                        break
                    }
                }
            }

            Spacer()

            switch step {
            case .profileSetup:
                Button("Continue") {
                    viewModel.validationError = nil
                    guard viewModel.canAdvance(from: .profileSetup) else {
                        viewModel.validationError = "Enter a valid partner profile."
                        return
                    }
                    step = .goalSetup
                }
                .buttonStyle(.borderedProminent)
            case .goalSetup:
                Button("Continue") {
                    viewModel.validationError = nil
                    guard viewModel.canAdvance(from: .goalSetup) else {
                        viewModel.validationError = "Goal date must be 2 weeks to 2 years from today."
                        return
                    }
                    viewModel.calculateTargets()
                    step = .caloriePreview
                }
                .buttonStyle(.borderedProminent)
            case .caloriePreview:
                Button("Save Partner") {
                    savePartner(viewModel: viewModel)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }

    private func savePartner(viewModel: OnboardingViewModel) {
        viewModel.validationError = nil
        viewModel.calculateTargets()
        do {
            let profile = appContainer.userProfileRepository.makeUserProfile(from: viewModel.profileB)
            try appContainer.userProfileRepository.save([profile], context: modelContext)
            Task {
                await appContainer.notificationManager.scheduleWeighInReminder(
                    userId: profile.id,
                    name: profile.name
                )
            }
            AppStorageKey.bumpProfileDataRevision()
            onPartnerAdded()
            dismiss()
        } catch {
            viewModel.validationError = error.localizedDescription
        }
    }
}

#Preview {
    AddPartnerFlowView(onPartnerAdded: {})
        .environment(AppContainer())
        .modelContainer(for: [UserProfile.self], inMemory: true)
}
