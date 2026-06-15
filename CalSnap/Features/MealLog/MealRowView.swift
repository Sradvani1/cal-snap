import SwiftUI
import UIKit

struct MealRowView: View {
    let meal: MealEntry
    let onSelect: () -> Void

    @State private var thumbnail: UIImage?

    var body: some View {
        Button(action: onSelect) {
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

                if let thumbnail {
                    Image(uiImage: thumbnail)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 44, height: 44)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(
            "\(meal.mealType.displayName), \(meal.timestamp.formatted(date: .omitted, time: .shortened)), \(meal.totalCalories) calories"
        )
        .accessibilityHint("Opens meal detail")
        .task(id: meal.id) {
            if let photoData = meal.photoData {
                thumbnail = UIImage(data: photoData)
            } else {
                thumbnail = nil
            }
        }
    }
}

#Preview {
    MealRowView(
        meal: MealEntry(
            userId: UUID(),
            timestamp: Date.now,
            mealType: .lunch,
            totalCalories: 650,
            totalProteinG: 40,
            totalCarbsG: 55,
            totalFatG: 22
        ),
        onSelect: {}
    )
    .padding()
}
