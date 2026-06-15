import SwiftUI

struct ManualMealItemCard: View {
    @Binding var item: EditableFoodItem
    let canRemove: Bool
    let onRemove: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("mealScanner.manual.item")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                if canRemove {
                    Button("mealScanner.manual.removeItem", systemImage: "trash", role: .destructive, action: onRemove)
                        .labelStyle(.iconOnly)
                }
            }

            TextField("mealScanner.manual.nameField", text: $item.name)

            HStack {
                TextField("designSystem.nutrient.calories", value: $item.calories, format: .number)
                    .keyboardType(.numberPad)
                Text("units.kcal")
                    .foregroundStyle(.secondary)
            }

            HStack {
                macroField("mealScanner.manual.proteinField", value: $item.proteinG)
                macroField("mealScanner.manual.carbsField", value: $item.carbsG)
            }

            HStack {
                macroField("mealScanner.manual.fatField", value: $item.fatG)
                macroField("mealScanner.manual.fiberField", value: $item.fiberG)
            }

            HStack {
                TextField("mealScanner.manual.weightField", value: $item.weightG, format: .number)
                    .keyboardType(.decimalPad)
                Text("units.grams")
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.csSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func macroField(_ label: LocalizedStringKey, value: Binding<Double>) -> some View {
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
