import SwiftUI

struct FoodItemRowView: View {
    let item: EditableFoodItem
    var onEdit: (() -> Void)?

    var body: some View {
        Group {
            if let onEdit {
                Button(action: onEdit) {
                    rowContent
                }
                .buttonStyle(.plain)
                .accessibilityHint("Opens item editor")
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
                            .foregroundStyle(Color.csAccent)
                            .font(.caption)
                        Text("Adjust?")
                            .font(.csCaption)
                            .foregroundStyle(Color.csAccent)
                    }
                }
                Text("\(Int(item.weightG.rounded()))g · \(item.calories) kcal")
                    .font(.csCaption)
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
        .background(Color.csSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(rowAccessibilityLabel)
    }

    private var rowAccessibilityLabel: String {
        var parts = ["\(item.name), \(item.calories) calories"]
        if item.isFlagged {
            parts.append("flagged for review")
        }
        return parts.joined(separator: ", ")
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
