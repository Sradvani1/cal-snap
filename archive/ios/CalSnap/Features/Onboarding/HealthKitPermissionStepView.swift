import SwiftUI

struct HealthKitPermissionStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("onboarding.healthKit.title")
                .font(.title2.bold())

            Text("onboarding.healthKit.description")
                .foregroundStyle(.secondary)

            Label("onboarding.healthKit.optional", systemImage: "heart.text.square")
                .font(.footnote)
                .foregroundStyle(.secondary)

            Button("onboarding.healthKit.connect") {
                Task { await viewModel.requestHealthKit() }
            }
            .buttonStyle(.bordered)

            if let error = viewModel.healthKitError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.orange)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    HealthKitPermissionStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
