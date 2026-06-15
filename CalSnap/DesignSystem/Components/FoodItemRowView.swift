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
                .accessibilityHint("designSystem.foodItem.editHint")
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
                        Text("designSystem.foodItem.flaggedAdjust")
                            .font(.csCaption)
                            .foregroundStyle(Color.csAccent)
                    }
                }
                Text(String(format: String(localized: "designSystem.foodItem.weightCalories"), Int(item.weightG.rounded()), item.calories))
                    .font(.csCaption)
                    .foregroundStyle(.secondary)
                Text(String(format: String(localized: "designSystem.foodItem.macroSummary"), Int(item.proteinG.rounded()), Int(item.carbsG.rounded()), Int(item.fatG.rounded())))
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
        var parts = [
            String(format: String(localized: "designSystem.foodItem.accessibility.row"), item.name, item.calories)
        ]
        if item.isFlagged {
            parts.append(String(localized: "designSystem.foodItem.accessibility.flagged"))
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
