import SwiftUI

struct AnalyticsInsightCard: View {
    let hasEnoughData: Bool
    let isGenerating: Bool
    let insightText: String?
    let errorText: String?
    let onGenerate: () -> Void

    var body: some View {
        AnalyticsSectionCard(title: "Insights") {
            VStack(alignment: .leading, spacing: 12) {
                if let insightText {
                    Text(insightText)
                        .font(.body)
                }

                if let errorText {
                    Text(errorText)
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                Button(action: onGenerate) {
                    HStack {
                        if isGenerating {
                            ProgressView()
                                .controlSize(.small)
                        }
                        Text(isGenerating ? "Generating…" : "Generate insight")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(!hasEnoughData || isGenerating)
                .accessibilityLabel("Generate AI insight")
                .accessibilityHint(
                    hasEnoughData
                        ? "Summarizes your dietary patterns using aggregated stats"
                        : "Log at least three days of meals first"
                )

                if !hasEnoughData {
                    Text("Log at least 3 days of meals to generate insights.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

#Preview {
    AnalyticsInsightCard(
        hasEnoughData: true,
        isGenerating: false,
        insightText: "Your protein intake is on track. Consider adding more fiber-rich foods on weekends.",
        errorText: nil,
        onGenerate: {}
    )
    .padding()
}
