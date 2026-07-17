import SwiftUI

struct OnboardingDoneStepView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.largeTitle)
                .imageScale(.large)
                .foregroundStyle(.green)
            Text("onboarding.done.title")
                .font(.title.bold())
            Text("onboarding.done.subtitle")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    OnboardingDoneStepView()
}
