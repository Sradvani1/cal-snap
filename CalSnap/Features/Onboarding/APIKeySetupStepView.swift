import SwiftUI

struct APIKeySetupStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("onboarding.apiKeys.title")
                .font(.title2.bold())

            Text("onboarding.apiKeys.geminiDescription")
                .font(.footnote)
                .foregroundStyle(.secondary)

            SecureField("settings.apiKeys.geminiField", text: $viewModel.geminiAPIKeyInput)
                .textFieldStyle(.roundedBorder)

            HStack {
                Button("settings.apiKeys.testKey") {
                    Task { await viewModel.testGeminiKey() }
                }
                .disabled(viewModel.geminiTestState == .testing)

                GeminiTestIndicatorView(state: viewModel.geminiTestState)
            }

            Text("onboarding.apiKeys.usdaTitle")
                .font(.headline)
                .padding(.top, 8)

            Text("onboarding.apiKeys.usdaDescription")
                .font(.footnote)
                .foregroundStyle(.secondary)

            SecureField("settings.apiKeys.usdaField", text: $viewModel.usdaAPIKeyInput)
                .textFieldStyle(.roundedBorder)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    APIKeySetupStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
