import SwiftUI

struct MealAnalysisResultView: View {
    let image: UIImage?
    let totalCalories: Int
    let proteinG: Double
    let carbsG: Double
    let fatG: Double
    let items: [EditableFoodItem]
    let estimationNotes: String?
    let confidenceLevel: ConfidenceLevel
    let overallConfidence: Double
    let isManualEntry: Bool
    let allItemsFlagged: Bool
    let canLog: Bool
    let isLogging: Bool
    let logError: String?
    @Binding var mealType: MealType
    let onEditItem: (UUID) -> Void
    let onLog: () -> Void
    let onReAnalyze: () -> Void
    let onDiscard: () -> Void

    @State private var showDiscardAlert = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 120)
                        .frame(maxWidth: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                VStack(spacing: 4) {
                    Text("\(totalCalories)")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                    Text("calories")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                MacroSplitBar(proteinG: proteinG, carbsG: carbsG, fatG: fatG)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Food items")
                        .font(.headline)
                    ForEach(items) { item in
                        FoodItemRowView(item: item) {
                            onEditItem(item.id)
                        }
                    }
                }

                if allItemsFlagged {
                    Label("Review all items before logging", systemImage: "exclamationmark.triangle.fill")
                        .font(.subheadline)
                        .foregroundStyle(.orange)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.orange.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if let estimationNotes, !isManualEntry {
                    EstimationNotesAccordion(notes: estimationNotes)
                }

                ConfidenceIndicator(
                    level: confidenceLevel,
                    score: overallConfidence,
                    isManualEntry: isManualEntry
                )

                MealTypeSelector(selection: $mealType)

                if let logError {
                    Label(logError, systemImage: "exclamationmark.circle.fill")
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Button {
                    onLog()
                } label: {
                    if isLogging {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Log This Meal")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(!canLog || isLogging)

                Button("Re-analyze", action: onReAnalyze)
                    .frame(maxWidth: .infinity)

                Button("Discard", role: .destructive) {
                    showDiscardAlert = true
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
        }
        .alert("Discard this meal?", isPresented: $showDiscardAlert) {
            Button("Discard", role: .destructive, action: onDiscard)
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Nothing will be saved.")
        }
    }
}

#Preview {
    MealAnalysisResultView(
        image: nil,
        totalCalories: 382,
        proteinG: 49,
        carbsG: 28,
        fatG: 6,
        items: [
            EditableFoodItem(
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
        ],
        estimationNotes: "Estimated from plate size.",
        confidenceLevel: .high,
        overallConfidence: 0.9,
        isManualEntry: false,
        allItemsFlagged: false,
        canLog: true,
        isLogging: false,
        logError: nil,
        mealType: .constant(.lunch),
        onEditItem: { _ in },
        onLog: {},
        onReAnalyze: {},
        onDiscard: {}
    )
}
