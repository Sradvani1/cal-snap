import SwiftUI

struct WelcomeStepView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("CalSnap")
                .font(.largeTitle.bold())
            Text("Eat smart. Lose weight. No obsession.")
                .font(.title3)
                .foregroundStyle(.secondary)

            Text("CalSnap runs fully on your iPhone. Your meals, weight, and settings stay on this device.")
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    WelcomeStepView()
}
