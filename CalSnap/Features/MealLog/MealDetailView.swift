import SwiftData
import SwiftUI
import UIKit

private struct ShareImageItem: Identifiable {
    let id = UUID()
    let image: UIImage
}

private struct PhotoLoadKey: Equatable {
    let reloadToken: Int
    let photoByteCount: Int
}

struct MealDetailView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let mealId: UUID
    let mealDetailReloadToken: Int
    let onMealChanged: () -> Void
    @Binding var navigationPath: [DashboardRoute]

    @State private var viewModel: MealDetailViewModel?
    @State private var photoImage: UIImage?
    @State private var showDeleteConfirmation = false
    @State private var shareItem: ShareImageItem?

    private var photoLoadKey: PhotoLoadKey? {
        guard let meal = viewModel?.meal else { return nil }
        return PhotoLoadKey(
            reloadToken: mealDetailReloadToken,
            photoByteCount: meal.photoData?.count ?? 0
        )
    }

    var body: some View {
        Group {
            if let viewModel {
                if let displayedMeal = viewModel.meal {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            if let photoImage {
                                Image(uiImage: photoImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(height: 200)
                                    .frame(maxWidth: .infinity)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                    .accessibilityLabel("mealLog.photo.accessibility")
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(displayedMeal.mealType.displayName)
                                    .font(.headline)
                                Text(displayedMeal.timestamp.formatted(date: .complete, time: .shortened))
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }

                            CalorieTotalView(calories: displayedMeal.totalCalories)

                            MacroBarView(
                                proteinG: displayedMeal.totalProteinG,
                                carbsG: displayedMeal.totalCarbsG,
                                fatG: displayedMeal.totalFatG
                            )

                            VStack(alignment: .leading, spacing: 8) {
                                Text("mealLog.detail.foodItems")
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

                            ConfidenceBadge(
                                level: ConfidenceLevel.from(score: displayedMeal.geminiConfidence),
                                score: displayedMeal.geminiConfidence,
                                isManualEntry: displayedMeal.geminiConfidence == 0
                            )

                            if let error = viewModel.loadError {
                                Text(error)
                                    .font(.caption)
                                    .foregroundStyle(Color.csDanger)
                            }

                            if let shareError = viewModel.shareError {
                                Text(shareError)
                                    .font(.caption)
                                    .foregroundStyle(Color.csDanger)
                            }
                        }
                        .padding()
                    }
                } else if viewModel.loadError != nil {
                    ContentUnavailableView(
                        "mealLog.detail.notFound.title",
                        systemImage: "fork.knife.circle",
                        description: Text(viewModel.loadError ?? String(localized: "mealLog.detail.notFound.message"))
                    )
                } else {
                    ProgressView()
                }
            } else {
                ProgressView()
            }
        }
        .navigationTitle("mealLog.detail.navigationTitle")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if viewModel?.meal != nil {
                    Button("common.button.edit") {
                        navigationPath.append(.mealScanner(.edit(mealId)))
                    }
                    .accessibilityHint("mealLog.detail.editHint")
                    Button("common.button.share", systemImage: "square.and.arrow.up") {
                        shareMeal()
                    }
                    .labelStyle(.iconOnly)
                    .accessibilityHint("mealLog.detail.shareHint")
                }
            }
            ToolbarItem(placement: .destructiveAction) {
                if viewModel?.meal != nil {
                    Button("common.button.delete", role: .destructive) {
                        showDeleteConfirmation = true
                    }
                    .accessibilityHint("mealLog.detail.deleteHint")
                }
            }
        }
        .task {
            if viewModel == nil {
                viewModel = MealDetailViewModel(
                    mealRepository: appContainer.mealRepository,
                    healthKitService: appContainer.healthKitService
                )
                reloadMealData()
            }
        }
        .task(id: mealDetailReloadToken) {
            guard viewModel != nil else { return }
            reloadMealData()
        }
        .task(id: photoLoadKey) {
            await loadPhoto()
        }
        .alert("dashboard.alert.deleteMeal.title", isPresented: $showDeleteConfirmation) {
            Button("common.button.delete", role: .destructive) {
                deleteMeal()
            }
            Button("common.button.cancel", role: .cancel) {}
        } message: {
            Text("dashboard.alert.deleteMeal.message")
        }
        .sheet(item: $shareItem) { item in
            ShareSheet(items: [item.image])
        }
    }

    private func reloadMealData() {
        viewModel?.load(mealId: mealId, context: modelContext)
    }

    private func loadPhoto() async {
        guard let photoData = viewModel?.meal?.photoData else {
            photoImage = nil
            return
        }

        let decoded = await Task.detached(priority: .userInitiated) {
            UIImage(data: photoData)
        }.value
        photoImage = decoded
    }

    private func shareMeal() {
        guard let viewModel else { return }
        viewModel.shareError = nil
        if let image = viewModel.makeShareImage() {
            shareItem = ShareImageItem(image: image)
        } else {
            viewModel.shareError = String(localized: "mealLog.share.error")
        }
    }

    private func deleteMeal() {
        guard let viewModel, let displayedMeal = viewModel.meal else { return }

        do {
            try viewModel.deleteMeal(meal: displayedMeal, context: modelContext)
            onMealChanged()
            dismiss()
        } catch {
            viewModel.loadError = error.localizedDescription
        }
    }
}

#Preview {
    @Previewable @State var path: [DashboardRoute] = []
    let mealId = UUID()

    NavigationStack {
        MealDetailView(
            mealId: mealId,
            mealDetailReloadToken: 0,
            onMealChanged: {},
            navigationPath: $path
        )
        .environment(AppContainer())
    }
}
