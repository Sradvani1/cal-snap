import SwiftData
import SwiftUI
import UIKit

struct MealDetailView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let mealId: UUID
    let onMealChanged: () -> Void
    @Binding var navigationPath: [DashboardRoute]

    @State private var viewModel = MealDetailViewModel()
    @State private var showDeleteConfirmation = false
    @State private var showShareSheet = false
    @State private var shareImage: UIImage?

    var body: some View {
        Group {
            if let displayedMeal = viewModel.meal {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        if let photoData = displayedMeal.photoData,
                           let uiImage = UIImage(data: photoData) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFill()
                                .frame(height: 200)
                                .frame(maxWidth: .infinity)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .accessibilityLabel("Meal photo")
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text(displayedMeal.mealType.displayName)
                                .font(.headline)
                            Text(displayedMeal.timestamp.formatted(date: .complete, time: .shortened))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }

                        CalorieTotalView(calories: displayedMeal.totalCalories)

                        MacroSplitBar(
                            proteinG: displayedMeal.totalProteinG,
                            carbsG: displayedMeal.totalCarbsG,
                            fatG: displayedMeal.totalFatG
                        )

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Food items")
                                .font(.headline)
                            ForEach(displayedMeal.items, id: \.id) { item in
                                FoodItemRowView(
                                    item: EditableFoodItem.from(foodItem: item),
                                    onEdit: nil
                                )
                            }
                        }

                        if let notes = displayedMeal.estimationNotes,
                           displayedMeal.geminiConfidence > 0 {
                            EstimationNotesAccordion(notes: notes)
                        }

                        ConfidenceIndicator(
                            level: confidenceLevel(for: displayedMeal.geminiConfidence),
                            score: displayedMeal.geminiConfidence,
                            isManualEntry: displayedMeal.geminiConfidence == 0
                        )

                        if let error = viewModel.loadError {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }
                    .padding()
                }
            } else if viewModel.loadError != nil {
                ContentUnavailableView(
                    "Meal not found",
                    systemImage: "fork.knife.circle",
                    description: Text(viewModel.loadError ?? "This meal may have been deleted.")
                )
            } else {
                ProgressView()
            }
        }
        .navigationTitle("Meal Detail")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if viewModel.meal != nil {
                    Button("Edit") {
                        navigationPath.append(.mealScanner(.edit(mealId)))
                    }
                    Button {
                        shareImage = viewModel.makeShareImage()
                        showShareSheet = shareImage != nil
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .accessibilityLabel("Share")
                }
            }
            ToolbarItem(placement: .destructiveAction) {
                if viewModel.meal != nil {
                    Button("Delete", role: .destructive) {
                        showDeleteConfirmation = true
                    }
                }
            }
        }
        .task(id: mealId) {
            viewModel.load(mealId: mealId, context: modelContext)
        }
        .onChange(of: navigationPath.count) { oldCount, newCount in
            if newCount < oldCount {
                viewModel.load(mealId: mealId, context: modelContext)
            }
        }
        .alert("Delete this meal?", isPresented: $showDeleteConfirmation) {
            Button("Delete", role: .destructive) {
                deleteMeal()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This removes the meal from your log and reverses the HealthKit entry.")
        }
        .sheet(isPresented: $showShareSheet) {
            if let shareImage {
                ShareSheet(items: [shareImage])
            }
        }
    }

    private func deleteMeal() {
        guard let displayedMeal = viewModel.meal else { return }

        do {
            try viewModel.deleteMeal(
                meal: displayedMeal,
                mealRepository: appContainer.mealRepository,
                healthKitService: appContainer.healthKitService,
                context: modelContext
            )
            onMealChanged()
            dismiss()
        } catch {
            viewModel.loadError = error.localizedDescription
        }
    }

    private func confidenceLevel(for score: Double) -> ConfidenceLevel {
        switch score {
        case 0.8...: return .high
        case 0.6..<0.8: return .medium
        default: return .low
        }
    }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    @Previewable @State var path: [DashboardRoute] = []
    let mealId = UUID()

    NavigationStack {
        MealDetailView(mealId: mealId, onMealChanged: {}, navigationPath: $path)
            .environment(AppContainer())
    }
}
