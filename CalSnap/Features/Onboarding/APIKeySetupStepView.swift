import SwiftUI

struct APIKeySetupStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("API Keys")
                .font(.title2.bold())

            Text("Gemini powers meal photo analysis. You can add your key now or skip and add it later in Settings.")
                .font(.footnote)
                .foregroundStyle(.secondary)

            SecureField("Gemini API key", text: $viewModel.geminiAPIKeyInput)
                .textFieldStyle(.roundedBorder)

            HStack {
                Button("Test Key") {
                    Task { await viewModel.testGeminiKey() }
                }
                .disabled(viewModel.geminiTestState == .testing)

                geminiTestIndicator
            }

            Text("USDA API key (optional)")
                .font(.headline)
                .padding(.top, 8)

            Text("Leave blank to use the built-in demo key for common food lookups.")
                .font(.footnote)
                .foregroundStyle(.secondary)

            SecureField("USDA API key", text: $viewModel.usdaAPIKeyInput)
                .textFieldStyle(.roundedBorder)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var geminiTestIndicator: some View {
        switch viewModel.geminiTestState {
        case .idle:
            EmptyView()
        case .testing:
            ProgressView()
        case .success:
            Label("Valid key", systemImage: "checkmark.circle.fill")
                .foregroundStyle(.green)
                .font(.footnote)
        case .failure(let message):
            Label(message, systemImage: "xmark.circle.fill")
                .foregroundStyle(.red)
                .font(.footnote)
                .lineLimit(2)
        }
    }
}

#Preview {
    APIKeySetupStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
