import SwiftUI

struct NutrientStatRow: View {
    let label: String
    let value: String
    var unit: String?
    var target: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.csCaption)
                .foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.subheadline.weight(.semibold))
                if let unit {
                    Text(unit)
                        .font(.csCaption)
                        .foregroundStyle(.secondary)
                }
            }
            if let target {
                Text(String(format: String(localized: "designSystem.nutrientStat.target"), target))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
    }

    private var accessibilityLabel: String {
        if let target {
            return String(format: String(localized: "designSystem.nutrientStat.accessibility.withTarget"), label, value, target)
        }
        return String(format: String(localized: "designSystem.nutrientStat.accessibility.basic"), label, value)
    }
}

#Preview {
    HStack {
        NutrientStatRow(label: "Avg intake", value: "1900")
        NutrientStatRow(label: "Target", value: "2000", unit: "kcal")
    }
    .padding()
}
