import SwiftUI

struct FoodItemEditSheet: View {
    let item: EditableFoodItem
    let isManualEntry: Bool
    let onSave: (String, Double) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var weightText: String
    @State private var previewItem: EditableFoodItem

    init(item: EditableFoodItem, isManualEntry: Bool, onSave: @escaping (String, Double) -> Void) {
        self.item = item
        self.isManualEntry = isManualEntry
        self.onSave = onSave
        _name = State(initialValue: item.name)
        _weightText = State(initialValue: String(format: "%.0f", item.weightG))
        _previewItem = State(initialValue: item)
    }

    var body: some View {
        NavigationStack {
            Form {
                if isManualEntry {
                    TextField("mealScanner.itemEdit.nameField", text: $name)
                } else {
                    LabeledContent("mealScanner.itemEdit.itemLabel", value: item.name)
                }

                TextField("mealScanner.itemEdit.weightField", text: $weightText)
                    .keyboardType(.decimalPad)
                    .onChange(of: weightText) { _, _ in
                        updatePreview()
                    }

                Section("mealScanner.itemEdit.nutritionSection") {
                    LabeledContent(
                        "designSystem.nutrient.calories",
                        value: String(format: String(localized: "designSystem.nutrient.caloriesValue"), previewItem.calories)
                    )
                    LabeledContent(
                        "designSystem.macroBar.protein",
                        value: String(format: String(localized: "units.gramsValue"), Int(previewItem.proteinG.rounded()))
                    )
                    LabeledContent(
                        "designSystem.macroBar.carbs",
                        value: String(format: String(localized: "units.gramsValue"), Int(previewItem.carbsG.rounded()))
                    )
                    LabeledContent(
                        "designSystem.macroBar.fat",
                        value: String(format: String(localized: "units.gramsValue"), Int(previewItem.fatG.rounded()))
                    )
                }
            }
            .navigationTitle("mealScanner.itemEdit.navigationTitle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("common.button.cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("common.button.save") {
                        let weight = Double(weightText) ?? item.weightG
                        onSave(name, weight)
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
        .presentationSizing(.form)
    }

    private var canSave: Bool {
        let weight = Double(weightText) ?? 0
        let trimmedName = isManualEntry
            ? name.trimmingCharacters(in: .whitespacesAndNewlines)
            : item.name
        return weight > 0 && !trimmedName.isEmpty
    }

    private func updatePreview() {
        guard let weight = Double(weightText), weight > 0 else { return }
        var updated = item
        if !isManualEntry {
            updated.updateWeight(to: weight)
        } else {
            updated.weightG = weight
        }
        previewItem = updated
    }
}

#Preview {
    FoodItemEditSheet(
        item: EditableFoodItem(
            name: "Chicken",
            weightG: 150,
            calories: 248,
            proteinG: 46,
            carbsG: 0,
            fatG: 5,
            fiberG: 0,
            confidence: 0.9,
            isFlagged: false
        ),
        isManualEntry: false,
        onSave: { _, _ in }
    )
}
