import SwiftUI
import UIKit

struct TodaysMealsSection: View {
    let meals: [MealEntry]

    private var groupedMeals: [(MealType, [MealEntry])] {
        let order: [MealType] = [.breakfast, .lunch, .dinner, .snack]
        return order.compactMap { type in
            let sectionMeals = meals.filter { $0.mealType == type }
            guard !sectionMeals.isEmpty else { return nil }
            return (type, sectionMeals)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today's Meals")
                .font(.headline)

            if meals.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "fork.knife")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                    Text("No meals logged today")
                        .font(.subheadline)
                    Text("Tap + to scan your first meal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            } else {
                ForEach(groupedMeals, id: \.0) { mealType, sectionMeals in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(mealType.displayName)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)

                        ForEach(sectionMeals, id: \.id) { meal in
                            mealRow(meal)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func mealRow(_ meal: MealEntry) -> some View {
        HStack(spacing: 12) {
            Image(systemName: meal.mealType.systemImage)
                .frame(width: 28)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 2) {
                Text(meal.timestamp.formatted(date: .omitted, time: .shortened))
                    .font(.subheadline)
                Text("\(meal.totalCalories) kcal")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if let photoData = meal.photoData, let uiImage = UIImage(data: photoData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 44, height: 44)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview("Empty") {
    TodaysMealsSection(meals: [])
        .padding()
}

#Preview("Populated") {
    TodaysMealsSection(meals: [
        MealEntry(
            userId: UUID(),
            timestamp: Date(),
            mealType: .breakfast,
            totalCalories: 420,
            totalProteinG: 25,
            totalCarbsG: 40,
            totalFatG: 15
        ),
        MealEntry(
            userId: UUID(),
            timestamp: Date(),
            mealType: .lunch,
            totalCalories: 650,
            totalProteinG: 40,
            totalCarbsG: 55,
            totalFatG: 22
        ),
    ])
    .padding()
}
