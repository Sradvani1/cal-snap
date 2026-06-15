import SwiftUI
import UIKit

struct MealListView: View {
    let meals: [MealEntry]
    let onSelect: (MealEntry) -> Void
    let onEdit: (MealEntry) -> Void
    let onDelete: (MealEntry) -> Void
    let onAdd: (MealType) -> Void

    private static let rowHeight: CGFloat = 56
    private static let rowPhotoHeightBonus: CGFloat = 12
    private static let emptyRowHeight: CGFloat = 44
    private static let sectionHeaderHeight: CGFloat = 32

    private let mealTypeOrder: [MealType] = [.breakfast, .lunch, .dinner, .snack]

    private var listHeight: CGFloat {
        mealTypeOrder.reduce(0) { height, mealType in
            let sectionMeals = meals.filter { $0.mealType == mealType }
            let rowsHeight = sectionMeals.isEmpty
                ? Self.emptyRowHeight
                : sectionMeals.reduce(0) { partial, meal in
                    partial + Self.rowHeight + (meal.photoData != nil ? Self.rowPhotoHeightBonus : 0)
                }
            return height + Self.sectionHeaderHeight + rowsHeight
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today's Meals")
                .font(.headline)

            List {
                ForEach(mealTypeOrder, id: \.self) { mealType in
                    Section(mealType.displayName) {
                        let sectionMeals = meals.filter { $0.mealType == mealType }
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
                                mealRow(meal)
                                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                        Button(role: .destructive) {
                                            onDelete(meal)
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                    }
                                    .contextMenu {
                                        Button {
                                            onSelect(meal)
                                        } label: {
                                            Label("View", systemImage: "eye")
                                        }
                                        Button {
                                            onEdit(meal)
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
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .scrollDisabled(true)
            .frame(height: listHeight)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func mealRow(_ meal: MealEntry) -> some View {
        Button {
            onSelect(meal)
        } label: {
            HStack(spacing: 12) {
                Image(systemName: meal.mealType.systemImage)
                    .frame(width: 28)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 2) {
                    Text(meal.timestamp.formatted(date: .omitted, time: .shortened))
                        .font(.subheadline)
                        .foregroundStyle(.primary)
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
        .buttonStyle(.plain)
    }
}

#Preview("Empty sections") {
    MealListView(
        meals: [],
        onSelect: { _ in },
        onEdit: { _ in },
        onDelete: { _ in },
        onAdd: { _ in }
    )
    .padding()
}

#Preview("Populated") {
    MealListView(
        meals: [
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
        ],
        onSelect: { _ in },
        onEdit: { _ in },
        onDelete: { _ in },
        onAdd: { _ in }
    )
    .padding()
}
