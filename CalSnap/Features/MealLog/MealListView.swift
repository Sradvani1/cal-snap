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

            VStack(alignment: .leading, spacing: 16) {
                ForEach(mealTypeOrder, id: \.self) { mealType in
                    MealListSectionView(
                        mealType: mealType,
                        sectionMeals: mealsByType[mealType] ?? [],
                        onSelect: onSelect,
                        onEdit: onEdit,
                        onDelete: onDelete,
                        onAdd: onAdd
                    )
                }
            }
        }
        .sectionCard()
    }
}

private struct MealListSectionView: View {
    let mealType: MealType
    let sectionMeals: [MealEntry]
    let onSelect: (UUID) -> Void
    let onEdit: (UUID) -> Void
    let onDelete: (MealEntry) -> Void
    let onAdd: (MealType) -> Void

    private static let baseRowHeight: CGFloat = 52
    private static let rowPhotoHeightBonus: CGFloat = 16
    private static let listChromePaddingPerRow: CGFloat = 4

    var body: some View {
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
                List {
                    ForEach(sectionMeals, id: \.id) { meal in
                        MealRowView(meal: meal) {
                            onSelect(meal.id)
                        }
                        .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0))
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                        .frame(height: Self.rowHeight(for: meal))
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
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                onDelete(meal)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .scrollDisabled(true)
                .scrollContentBackground(.hidden)
                .frame(height: Self.sectionListHeight(meals: sectionMeals))
            }
        }
    }

    static func rowHeight(for meal: MealEntry) -> CGFloat {
        baseRowHeight + (meal.photoData != nil ? rowPhotoHeightBonus : 0)
    }

    static func sectionListHeight(meals: [MealEntry]) -> CGFloat {
        let rowHeights = meals.reduce(0) { $0 + rowHeight(for: $1) }
        return rowHeights + listChromePaddingPerRow * CGFloat(meals.count)
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
