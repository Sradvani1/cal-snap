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
            return "Macros: protein \(Int(proteinG.rounded())) grams, carbs \(Int(carbsG.rounded())) grams, fat \(Int(fatG.rounded())) grams"
        }
        return "No macro data"
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
                    legend(label: "Protein", value: proteinG, color: Color.csProtein)
                    legend(label: "Carbs", value: carbsG, color: Color.csCarbs)
                    legend(label: "Fat", value: fatG, color: Color.csFat)
                }
                .font(.csCaption)
            } else {
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.secondary.opacity(0.25))
                    .frame(height: 12)
                Text("No macro data")
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
            Text("\(label) \(Int(value.rounded()))g")
        }
    }
}

#Preview {
    MacroBarView(proteinG: 40, carbsG: 50, fatG: 20)
        .padding()
}
