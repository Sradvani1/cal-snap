import SwiftUI

struct MealShareCardView: View {
    let mealType: MealType
    let timestamp: Date
    let totalCalories: Int
    let proteinG: Double
    let carbsG: Double
    let fatG: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: mealType.systemImage)
                Text(mealType.displayName)
                    .font(.headline)
                Spacer()
                Text("brand.name")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            Text("\(totalCalories)")
                .font(.csLargeCalorie)
            Text("units.kcal")
                .font(.title3)
                .foregroundStyle(.secondary)

            HStack(spacing: 16) {
                macroLabel(String(localized: "units.macro.protein.short"), grams: proteinG)
                macroLabel(String(localized: "units.macro.carbs.short"), grams: carbsG)
                macroLabel(String(localized: "units.macro.fat.short"), grams: fatG)
            }

            Text(timestamp.formatted(date: .abbreviated, time: .shortened))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .frame(width: 320)
        .background(Color(.systemBackground))
    }

    private func macroLabel(_ label: String, grams: Double) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(String(format: String(localized: "units.gramsValue"), Int(grams.rounded())))
                .font(.subheadline.weight(.medium))
        }
    }
}

#Preview {
    MealShareCardView(
        mealType: .lunch,
        timestamp: Date(),
        totalCalories: 650,
        proteinG: 40,
        carbsG: 55,
        fatG: 22
    )
}
