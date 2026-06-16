import SwiftUI

struct ScannerErrorBanner: View {
    let error: ScannerError
    let onRetry: () -> Void
    let onManualEntry: () -> Void
    let onReAnalyze: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case .parse = error {
                Label {
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                        .textSelection(.enabled)
                } icon: {
                    Image(systemName: iconName)
                }
            } else if case .api = error {
                Label {
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                        .textSelection(.enabled)
                } icon: {
                    Image(systemName: iconName)
                }
            } else {
                Label(message, systemImage: iconName)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
            }

            HStack(spacing: 12) {
                if showsRetry {
                    Button("common.button.retry", action: onRetry)
                        .buttonStyle(.bordered)
                }
                if showsReAnalyze {
                    Button("common.button.tryAgain", action: onReAnalyze)
                        .buttonStyle(.bordered)
                }
                Button("mealScanner.capture.enterManually", action: onManualEntry)
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
            return String(localized: "mealScanner.error.offline")
        case .missingAPIKey:
            return String(localized: "error.gemini.apiKeyMissing")
        case .api(let detail):
            return String(format: String(localized: "mealScanner.error.analysisFailed"), detail)
        case .parse(let detail):
            return String(format: String(localized: "mealScanner.error.parseFailed"), detail)
        case .unrecognizable:
            return String(localized: "mealScanner.error.unrecognizable")
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
