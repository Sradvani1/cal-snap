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
                    TextField("Item name", text: $name)
                } else {
                    LabeledContent("Item", value: item.name)
                }

                TextField("Weight (g)", text: $weightText)
                    .keyboardType(.decimalPad)
                    .onChange(of: weightText) { _, _ in
                        updatePreview()
                    }

                Section("Updated nutrition") {
                    LabeledContent("Calories", value: "\(previewItem.calories) kcal")
                    LabeledContent("Protein", value: "\(Int(previewItem.proteinG.rounded()))g")
                    LabeledContent("Carbs", value: "\(Int(previewItem.carbsG.rounded()))g")
                    LabeledContent("Fat", value: "\(Int(previewItem.fatG.rounded()))g")
                }
            }
            .navigationTitle("Adjust item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let weight = Double(weightText) ?? item.weightG
                        onSave(name, weight)
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
        .presentationDetents([.medium])
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
