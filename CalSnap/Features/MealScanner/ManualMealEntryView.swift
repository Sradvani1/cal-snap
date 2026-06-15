import SwiftUI

struct ManualMealEntryView: View {
    @Bindable var viewModel: MealScannerViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Enter meal manually")
                    .font(.headline)

                Text("Add each food item with at least a name and calories.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                ForEach($viewModel.editableItems) { $item in
                    manualItemCard(item: $item)
                }

                Button {
                    viewModel.addManualItem()
                } label: {
                    Label("Add another item", systemImage: "plus.circle")
                }

                Button("Continue") {
                    viewModel.finishManualEntry()
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
                .disabled(!canContinue)
            }
            .padding()
        }
    }

    private var canContinue: Bool {
        viewModel.editableItems.allSatisfy { item in
            !item.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && item.calories > 0
        }
    }

    @ViewBuilder
    private func manualItemCard(item: Binding<EditableFoodItem>) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Item")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                if viewModel.editableItems.count > 1 {
                    Button(role: .destructive) {
                        viewModel.removeManualItem(id: item.wrappedValue.id)
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }

            TextField("Name", text: item.name)

            HStack {
                TextField("Calories", value: item.calories, format: .number)
                    .keyboardType(.numberPad)
                Text("kcal")
                    .foregroundStyle(.secondary)
            }

            HStack {
                macroField("Protein (g)", value: item.proteinG)
                macroField("Carbs (g)", value: item.carbsG)
            }

            HStack {
                macroField("Fat (g)", value: item.fatG)
                macroField("Fiber (g)", value: item.fiberG)
            }

            HStack {
                TextField("Weight (g)", value: item.weightG, format: .number)
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
    ManualMealEntryView(
        viewModel: MealScannerViewModel(
            userId: UUID(),
            mealAnalyzer: MockMealAnalyzer(),
            healthKitService: HealthKitService(),
            mealRepository: MealRepository()
        )
    )
}
