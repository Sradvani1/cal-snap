import SwiftUI

struct HealthKitPermissionStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Connect Apple Health")
                .font(.title2.bold())

            Text("CalSnap can read your weight and height from Apple Health, and write meals and weigh-ins back to keep your data in sync.")
                .foregroundStyle(.secondary)

            Label("Optional — you can continue without granting access", systemImage: "heart.text.square")
                .font(.footnote)
                .foregroundStyle(.secondary)

            Button("Connect to Apple Health") {
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
