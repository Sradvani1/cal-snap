import SwiftUI

struct MealScannerAnalyzingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("mealScanner.analyzing.title")
                .font(.headline)
            Text("mealScanner.analyzing.subtitle")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    MealScannerAnalyzingView()
}
