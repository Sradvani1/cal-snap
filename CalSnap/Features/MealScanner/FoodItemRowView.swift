import SwiftUI

struct FoodItemRowView: View {
    let item: EditableFoodItem
    var onEdit: (() -> Void)? = nil

    var body: some View {
        Group {
            if let onEdit {
                Button(action: onEdit) {
                    rowContent
                }
                .buttonStyle(.plain)
            } else {
                rowContent
            }
        }
    }

    private var rowContent: some View {
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
            if onEdit != nil {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
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
