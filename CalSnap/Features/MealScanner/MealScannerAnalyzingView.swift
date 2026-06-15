import SwiftUI

struct MealScannerAnalyzingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("Analyzing your meal...")
                .font(.headline)
            Text("This usually takes a few seconds")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    MealScannerAnalyzingView()
}
