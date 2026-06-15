import SwiftUI

struct MealListView: View {
    let mealsByType: [MealType: [MealEntry]]
    let onSelect: (UUID) -> Void
    let onEdit: (UUID) -> Void
    let onDelete: (MealEntry) -> Void
    let onAdd: (MealType) -> Void

    private let mealTypeOrder: [MealType] = [.breakfast, .lunch, .dinner, .snack]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today's Meals")
                .font(.headline)

            LazyVStack(alignment: .leading, spacing: 16) {
                ForEach(mealTypeOrder, id: \.self) { mealType in
                    sectionView(for: mealType)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func sectionView(for mealType: MealType) -> some View {
        let sectionMeals = mealsByType[mealType] ?? []

        VStack(alignment: .leading, spacing: 8) {
            Text(mealType.displayName)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            if sectionMeals.isEmpty {
                Button {
                    onAdd(mealType)
                } label: {
                    Label("Add \(mealType.displayName)", systemImage: "plus")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            } else {
                ForEach(sectionMeals, id: \.id) { meal in
                    MealRowView(meal: meal) {
                        onSelect(meal.id)
                    }
                    .contextMenu {
                        Button {
                            onSelect(meal.id)
                        } label: {
                            Label("View", systemImage: "eye")
                        }
                        Button {
                            onEdit(meal.id)
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }
                        Button(role: .destructive) {
                            onDelete(meal)
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }
}

#Preview("Empty sections") {
    MealListView(
        mealsByType: [:],
        onSelect: { _ in },
        onEdit: { _ in },
        onDelete: { _ in },
        onAdd: { _ in }
    )
    .padding()
}

#Preview("Populated") {
    let userId = UUID()
    MealListView(
        mealsByType: [
            .breakfast: [
                MealEntry(
                    userId: userId,
                    timestamp: Date.now,
                    mealType: .breakfast,
                    totalCalories: 420,
                    totalProteinG: 25,
                    totalCarbsG: 40,
                    totalFatG: 15
                ),
            ],
            .lunch: [
                MealEntry(
                    userId: userId,
                    timestamp: Date.now,
                    mealType: .lunch,
                    totalCalories: 650,
                    totalProteinG: 40,
                    totalCarbsG: 55,
                    totalFatG: 22
                ),
            ],
        ],
        onSelect: { _ in },
        onEdit: { _ in },
        onDelete: { _ in },
        onAdd: { _ in }
    )
    .padding()
}
