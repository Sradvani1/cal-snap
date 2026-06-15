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
                    ManualMealItemCard(
                        item: $item,
                        canRemove: viewModel.editableItems.count > 1,
                        onRemove: { viewModel.removeManualItem(id: item.id) }
                    )
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
