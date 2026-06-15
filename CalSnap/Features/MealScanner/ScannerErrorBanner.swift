import SwiftUI

struct ScannerErrorBanner: View {
    let error: ScannerError
    let onRetry: () -> Void
    let onManualEntry: () -> Void
    let onReAnalyze: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(message, systemImage: iconName)
                .font(.subheadline)
                .foregroundStyle(.primary)

            HStack(spacing: 12) {
                if showsRetry {
                    Button("Retry", action: onRetry)
                        .buttonStyle(.bordered)
                }
                if showsReAnalyze {
                    Button("Try again", action: onReAnalyze)
                        .buttonStyle(.bordered)
                }
                Button("Enter manually", action: onManualEntry)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.csDanger.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var message: String {
        switch error {
        case .offline:
            return "Offline mode: manual entry only"
        case .missingAPIKey:
            return "Gemini API key not configured. Add a key during setup or enter the meal manually."
        case .api(let detail):
            return "Analysis failed: \(detail)"
        case .parse(let detail):
            return "Could not read the analysis result: \(detail)"
        case .unrecognizable:
            return "We couldn't recognize this meal. Try a brighter photo, add a description, or enter manually."
        }
    }

    private var iconName: String {
        switch error {
        case .offline: return "wifi.slash"
        case .missingAPIKey: return "key.slash"
        case .api, .parse: return "exclamationmark.triangle"
        case .unrecognizable: return "eye.slash"
        }
    }

    private var showsRetry: Bool {
        switch error {
        case .api, .parse: return true
        default: return false
        }
    }

    private var showsReAnalyze: Bool {
        error == .unrecognizable
    }
}

#Preview {
    ScannerErrorBanner(
        error: .offline,
        onRetry: {},
        onManualEntry: {},
        onReAnalyze: {}
    )
    .padding()
}
