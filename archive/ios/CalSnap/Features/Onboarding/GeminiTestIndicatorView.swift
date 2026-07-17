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
            HStack(alignment: .top, spacing: 6) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.red)
                Text(message)
                    .foregroundStyle(.red)
                    .font(.footnote)
                    .fixedSize(horizontal: false, vertical: true)
                    .textSelection(.enabled)
            }
        }
    }
}

#Preview {
    VStack {
        GeminiTestIndicatorView(state: .success)
        GeminiTestIndicatorView(state: .failure("Invalid key"))
    }
}
