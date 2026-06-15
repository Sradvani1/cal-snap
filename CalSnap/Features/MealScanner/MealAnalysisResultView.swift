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
    let isEditing: Bool
    @Binding var mealType: MealType
    let onEditItem: (UUID) -> Void
    let onLog: () -> Void
    let onReAnalyze: () -> Void
    let onDiscard: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showDiscardAlert = false
    @State private var animateItems = false

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
                        .accessibilityLabel("Meal photo")
                }

                CalorieTotalView(calories: totalCalories)

                MacroBarView(proteinG: proteinG, carbsG: carbsG, fatG: fatG)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Food items")
                        .font(.headline)
                    ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                        FoodItemRowView(item: item) {
                            onEditItem(item.id)
                        }
                        .opacity(reduceMotion || animateItems ? 1 : 0)
                        .animation(
                            reduceMotion ? nil : .easeOut(duration: 0.3).delay(Double(index) * 0.05),
                            value: animateItems
                        )
                    }
                }
                .onAppear { animateItems = true }
                .onChange(of: items.count) { _, _ in
                    animateItems = false
                    animateItems = true
                }

                if allItemsFlagged {
                    Label("Review all items before logging", systemImage: "exclamationmark.triangle.fill")
                        .font(.subheadline)
                        .foregroundStyle(Color.csAccent)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.csAccent.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if let estimationNotes, !isManualEntry {
                    EstimationNotesAccordion(notes: estimationNotes)
                }

                ConfidenceBadge(
                    level: confidenceLevel,
                    score: overallConfidence,
                    isManualEntry: isManualEntry
                )

                MealTypeSelector(selection: $mealType)

                if let logError {
                    Label(logError, systemImage: "exclamationmark.circle.fill")
                        .font(.subheadline)
                        .foregroundStyle(Color.csDanger)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.csDanger.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Button {
                    onLog()
                } label: {
                    if isLogging {
                        ProgressView().frame(maxWidth: .infinity)
                    } else {
                        Text(isEditing ? "Save Changes" : "Log This Meal").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(!canLog || isLogging)
                .accessibilityHint(isEditing ? "Saves meal edits" : "Logs this meal to your daily log")

                if !isEditing {
                    Button("Re-analyze", action: onReAnalyze)
                        .frame(maxWidth: .infinity)
                        .accessibilityHint("Runs analysis again on the meal photo")
                }

                Button(isEditing ? "Cancel" : "Discard", role: .destructive) {
                    showDiscardAlert = true
                }
                .frame(maxWidth: .infinity)
                .accessibilityHint(isEditing ? "Discards unsaved edits" : "Discards this meal without saving")
            }
            .padding()
        }
        .alert(isEditing ? "Discard changes?" : "Discard this meal?", isPresented: $showDiscardAlert) {
            Button(isEditing ? "Discard Changes" : "Discard", role: .destructive, action: onDiscard)
            Button("Cancel", role: .cancel) {}
        } message: {
            Text(isEditing ? "Your edits will not be saved." : "Nothing will be saved.")
        }
    }
}
