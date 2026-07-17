import SwiftUI

struct AnalyticsInsightCard: View {
    let hasEnoughData: Bool
    let isGenerating: Bool
    let insightText: String?
    let errorText: String?
    let onGenerate: () -> Void

    var body: some View {
        AnalyticsSectionCard(title: String(localized: "analytics.section.insights")) {
            VStack(alignment: .leading, spacing: 12) {
                if let insightText {
                    Text(insightText)
                        .font(.body)
                }

                if let errorText {
                    Text(errorText)
                        .font(.caption)
                        .foregroundStyle(Color.csDanger)
                }

                Button(action: onGenerate) {
                    HStack {
                        if isGenerating {
                            ProgressView()
                                .controlSize(.small)
                        }
                        Text(isGenerating ? "analytics.insight.generating" : "analytics.insight.generate")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(!hasEnoughData || isGenerating)
                .accessibilityLabel("analytics.insight.generateAccessibility")
                .accessibilityHint(
                    hasEnoughData
                        ? String(localized: "analytics.insight.generateHint")
                        : String(localized: "analytics.insight.disabledHint")
                )

                if !hasEnoughData {
                    Text("analytics.insight.minimumDays")
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
