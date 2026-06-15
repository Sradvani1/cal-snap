import SwiftUI

struct WelcomeStepView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("brand.name")
                .font(.largeTitle.bold())
            Text("onboarding.welcome.tagline")
                .font(.title3)
                .foregroundStyle(.secondary)

            Text("onboarding.welcome.privacy")
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    WelcomeStepView()
}
