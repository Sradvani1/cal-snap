import SwiftUI
import SwiftData

struct OnboardingView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: OnboardingViewModel?

    var body: some View {
        Group {
            if let viewModel {
                NavigationStack {
                    VStack(spacing: 0) {
                        OnboardingStepContent(viewModel: viewModel)
                        OnboardingNavigationBar(viewModel: viewModel, modelContext: modelContext)
                    }
                    .navigationBarBackButtonHidden(true)
                }
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil {
                viewModel = OnboardingViewModel(
                    healthKitService: appContainer.healthKitService,
                    geminiService: appContainer.geminiService,
                    userProfileRepository: appContainer.userProfileRepository
                )
            }
        }
    }
}

#Preview {
    OnboardingView()
        .environment(AppContainer())
        .modelContainer(for: UserProfile.self, inMemory: true)
}
