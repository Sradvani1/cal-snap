import SwiftUI

struct ManualMealEntryView: View {
    @Bindable var viewModel: MealScannerViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("mealScanner.manual.title")
                    .font(.headline)

                Text("mealScanner.manual.subtitle")
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
                    Label("mealScanner.manual.addItem", systemImage: "plus.circle")
                }

                Button("common.button.continue") {
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
