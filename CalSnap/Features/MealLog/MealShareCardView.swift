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
                Text("CalSnap")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            Text("\(totalCalories)")
                .font(.csLargeCalorie)
            Text("kcal")
                .font(.title3)
                .foregroundStyle(.secondary)

            HStack(spacing: 16) {
                macroLabel("P", grams: proteinG)
                macroLabel("C", grams: carbsG)
                macroLabel("F", grams: fatG)
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
            Text("\(Int(grams.rounded()))g")
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
