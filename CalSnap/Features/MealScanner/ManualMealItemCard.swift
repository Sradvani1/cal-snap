import SwiftUI

struct ManualMealItemCard: View {
    @Binding var item: EditableFoodItem
    let canRemove: Bool
    let onRemove: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Item")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                if canRemove {
                    Button("Remove item", systemImage: "trash", role: .destructive, action: onRemove)
                        .labelStyle(.iconOnly)
                }
            }

            TextField("Name", text: $item.name)

            HStack {
                TextField("Calories", value: $item.calories, format: .number)
                    .keyboardType(.numberPad)
                Text("kcal")
                    .foregroundStyle(.secondary)
            }

            HStack {
                macroField("Protein (g)", value: $item.proteinG)
                macroField("Carbs (g)", value: $item.carbsG)
            }

            HStack {
                macroField("Fat (g)", value: $item.fatG)
                macroField("Fiber (g)", value: $item.fiberG)
            }

            HStack {
                TextField("Weight (g)", value: $item.weightG, format: .number)
                    .keyboardType(.decimalPad)
                Text("g")
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func macroField(_ label: String, value: Binding<Double>) -> some View {
        VStack(alignment: .leading) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            TextField(label, value: value, format: .number)
                .keyboardType(.decimalPad)
        }
    }
}

#Preview {
    ManualMealItemCard(
        item: .constant(EditableFoodItem.emptyManual()),
        canRemove: true,
        onRemove: {}
    )
    .padding()
}
