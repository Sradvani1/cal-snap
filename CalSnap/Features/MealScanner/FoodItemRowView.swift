import SwiftUI

struct FoodItemRowView: View {
    let item: EditableFoodItem
    let onEdit: () -> Void

    var body: some View {
        Button(action: onEdit) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(item.name)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.primary)
                        if item.isFlagged {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                                .font(.caption)
                            Text("Adjust?")
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }
                    }
                    Text("\(Int(item.weightG.rounded()))g · \(item.calories) kcal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("P \(Int(item.proteinG.rounded()))g · C \(Int(item.carbsG.rounded()))g · F \(Int(item.fatG.rounded()))g")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    FoodItemRowView(
        item: EditableFoodItem(
            name: "Grilled Chicken",
            weightG: 150,
            calories: 248,
            proteinG: 46,
            carbsG: 0,
            fatG: 5,
            fiberG: 0,
            confidence: 0.55,
            isFlagged: true
        ),
        onEdit: {}
    )
    .padding()
}
