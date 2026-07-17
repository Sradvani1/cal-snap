import SwiftUI

struct MacroBarView: View {
    let proteinG: Double
    let carbsG: Double
    let fatG: Double

    private var total: Double {
        proteinG + carbsG + fatG
    }

    private var accessibilitySummary: String {
        if total > 0 {
            return String(
                format: String(localized: "designSystem.macroBar.accessibility.summary"),
                Int(proteinG.rounded()),
                Int(carbsG.rounded()),
                Int(fatG.rounded())
            )
        }
        return String(localized: "designSystem.macroBar.noData")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if total > 0 {
                GeometryReader { geometry in
                    HStack(spacing: 0) {
                        segment(width: geometry.size.width * proteinG / total, color: Color.csProtein)
                        segment(width: geometry.size.width * carbsG / total, color: Color.csCarbs)
                        segment(width: geometry.size.width * fatG / total, color: Color.csFat)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
                .frame(height: 12)

                HStack(spacing: 16) {
                    legend(label: String(localized: "designSystem.macroBar.protein"), value: proteinG, color: Color.csProtein)
                    legend(label: String(localized: "designSystem.macroBar.carbs"), value: carbsG, color: Color.csCarbs)
                    legend(label: String(localized: "designSystem.macroBar.fat"), value: fatG, color: Color.csFat)
                }
                .font(.csCaption)
            } else {
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.secondary.opacity(0.25))
                    .frame(height: 12)
                Text("designSystem.macroBar.noData")
                    .font(.csCaption)
                    .foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilitySummary)
    }

    @ViewBuilder
    private func segment(width: CGFloat, color: Color) -> some View {
        if width > 0 {
            color.frame(width: width, height: 12)
        }
    }

    private func legend(label: String, value: Double, color: Color) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(String(format: String(localized: "designSystem.macroBar.legendFormat"), label, Int(value.rounded())))
        }
    }
}

#Preview {
    MacroBarView(proteinG: 40, carbsG: 50, fatG: 20)
        .padding()
}
