import SwiftUI

struct GeminiTestIndicatorView: View {
    let state: GeminiTestState

    var body: some View {
        switch state {
        case .idle:
            EmptyView()
        case .testing:
            ProgressView()
        case .success:
            Label("settings.apiKeys.validKey", systemImage: "checkmark.circle.fill")
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
    VStack {
        GeminiTestIndicatorView(state: .success)
        GeminiTestIndicatorView(state: .failure("Invalid key"))
    }
}
