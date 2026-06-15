import PhotosUI
import SwiftData
import SwiftUI
import UIKit

struct MealScannerView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let activeUserId: String
    let route: MealScannerRoute
    var onMealSaved: (() -> Void)? = nil

    @State private var viewModel: MealScannerViewModel?
    @State private var setupFailed = false
    @State private var editLoadFailed = false
    @State private var showCamera = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var showDiscardAlert = false
    @State private var didApplyRoute = false

    var body: some View {
        Group {
            if editLoadFailed {
                ContentUnavailableView(
                    "Meal not found",
                    systemImage: "fork.knife.circle",
                    description: Text("This meal may have been deleted.")
                )
            } else if let viewModel {
                scannerContent(viewModel: viewModel)
            } else if setupFailed {
                ContentUnavailableView(
                    "Unable to scan",
                    systemImage: "person.crop.circle.badge.exclamationmark",
                    description: Text("Select a profile on the dashboard and try again.")
                )
            } else {
                ProgressView()
            }
        }
        .navigationTitle(viewModel?.isEditing == true ? "Edit Meal" : "Scan Meal")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if viewModel == nil {
                if let userId = UUID(uuidString: activeUserId) {
                    viewModel = MealScannerViewModel(
                        userId: userId,
                        mealAnalyzer: appContainer.geminiService,
                        healthKitService: appContainer.healthKitService,
                        mealRepository: appContainer.mealRepository
                    )
                } else {
                    setupFailed = true
                }
            }
            applyRouteIfNeeded()
        }
        .onDisappear {
            viewModel?.cancelAnalysis()
        }
    }

    @ViewBuilder
    private func scannerContent(viewModel: MealScannerViewModel) -> some View {
        ZStack {
            switch viewModel.phase {
            case .capture, .error:
                captureView(viewModel: viewModel)
            case .analyzing:
                analyzingView
            case .results:
                MealAnalysisResultView(
                    image: viewModel.selectedImage,
                    totalCalories: viewModel.totalCalories,
                    proteinG: viewModel.totalProteinG,
                    carbsG: viewModel.totalCarbsG,
                    fatG: viewModel.totalFatG,
                    items: viewModel.editableItems,
                    estimationNotes: viewModel.estimationNotes,
                    confidenceLevel: viewModel.confidenceLevel,
                    overallConfidence: viewModel.overallConfidence,
                    isManualEntry: viewModel.isManualEntry,
                    allItemsFlagged: viewModel.allItemsFlagged,
                    canLog: viewModel.canLog,
                    isLogging: viewModel.isLogging,
                    logError: viewModel.logError,
                    isEditing: viewModel.isEditing,
                    mealType: Bindable(viewModel).mealType,
                    onEditItem: { id in viewModel.editingItemID = id },
                    onLog: { saveMeal(viewModel: viewModel) },
                    onReAnalyze: { viewModel.reAnalyze() },
                    onDiscard: {
                        if viewModel.isEditing {
                            dismiss()
                        } else {
                            viewModel.discard()
                            dismiss()
                        }
                    }
                )
            case .manual:
                ManualMealEntryView(viewModel: viewModel)
            }
        }
        .sheet(isPresented: editingSheetPresented(viewModel)) {
            if let id = viewModel.editingItemID,
               let item = viewModel.editableItems.first(where: { $0.id == id }) {
                FoodItemEditSheet(
                    item: item,
                    isManualEntry: viewModel.isManualEntry,
                    onSave: { name, weight in
                        if viewModel.isManualEntry,
                           let index = viewModel.editableItems.firstIndex(where: { $0.id == item.id }) {
                            viewModel.editableItems[index].name = name
                            viewModel.editableItems[index].weightG = weight
                        } else {
                            viewModel.adjustItem(id: item.id, newWeightG: weight)
                        }
                        viewModel.editingItemID = nil
                    }
                )
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraImagePicker { image in
                viewModel.selectedImage = MealScannerViewModel.normalizedImage(image)
                viewModel.scannerError = nil
            }
        }
        .onChange(of: selectedPhotoItem) { _, newItem in
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    viewModel.selectedImage = MealScannerViewModel.normalizedImage(image)
                    viewModel.scannerError = nil
                }
            }
        }
    }

    private func applyRouteIfNeeded() {
        guard !didApplyRoute, let viewModel else { return }
        didApplyRoute = true

        switch route {
        case .create(let initialMealType):
            if let initialMealType {
                viewModel.mealType = initialMealType
            }
        case .edit(let mealId):
            Task {
                do {
                    guard let meal = try appContainer.mealRepository.fetchMeal(id: mealId, context: modelContext) else {
                        editLoadFailed = true
                        return
                    }
                    viewModel.loadForEditing(meal: meal)
                } catch {
                    editLoadFailed = true
                }
            }
        }
    }

    @ViewBuilder
    private func captureView(viewModel: MealScannerViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let error = viewModel.scannerError {
                    ScannerErrorBanner(
                        error: error,
                        onRetry: { viewModel.retryAnalyze() },
                        onManualEntry: { viewModel.enterManualEntry() },
                        onReAnalyze: { viewModel.reAnalyze() }
                    )
                }

                Group {
                    if let image = viewModel.selectedImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 220)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    } else {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.secondarySystemBackground))
                            .frame(height: 220)
                            .overlay {
                                VStack(spacing: 8) {
                                    Image(systemName: "photo")
                                        .font(.largeTitle)
                                        .foregroundStyle(.secondary)
                                    Text("Add a meal photo")
                                        .foregroundStyle(.secondary)
                                }
                            }
                    }
                }

                if MealScannerViewModel.isCameraAvailable {
                    Button {
                        showCamera = true
                    } label: {
                        Label("Take Photo", systemImage: "camera")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                } else {
                    Text("Camera not available on this device. Choose a photo from your library or enter the meal manually.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                    Label("Choose from Library", systemImage: "photo.on.rectangle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                TextField("Add description (optional)", text: Bindable(viewModel).textDescription, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)

                if !viewModel.hasGeminiAPIKey {
                    Text("Gemini API key not configured. Add a key during setup or enter the meal manually.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Button("Analyze") {
                    viewModel.analyze()
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
                .disabled(!viewModel.canAnalyze)

                Button("Enter manually") {
                    viewModel.enterManualEntry()
                }
                .frame(maxWidth: .infinity)

                Button("Discard", role: .destructive) {
                    showDiscardAlert = true
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
        }
        .alert("Discard this meal?", isPresented: $showDiscardAlert) {
            Button("Discard", role: .destructive) {
                viewModel.discard()
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Nothing will be saved.")
        }
    }

    private var analyzingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("Analyzing your meal...")
                .font(.headline)
            Text("This usually takes a few seconds")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func saveMeal(viewModel: MealScannerViewModel) {
        guard !viewModel.isLogging else { return }

        Task {
            viewModel.isLogging = true
            viewModel.logError = nil
            do {
                try await viewModel.saveMeal(context: modelContext)
                if viewModel.isEditing {
                    onMealSaved?()
                    dismiss()
                } else {
                    viewModel.discard()
                    dismiss()
                }
            } catch {
                viewModel.logError = "Could not save meal. Please try again."
                print("Failed to save meal: \(error.localizedDescription)")
            }
            viewModel.isLogging = false
        }
    }

    private func editingSheetPresented(_ viewModel: MealScannerViewModel) -> Binding<Bool> {
        Binding(
            get: { viewModel.editingItemID != nil },
            set: { isPresented in
                if !isPresented {
                    viewModel.editingItemID = nil
                }
            }
        )
    }
}

#Preview {
    NavigationStack {
        MealScannerView(
            activeUserId: UUID().uuidString,
            route: .create(initialMealType: nil)
        )
        .environment(AppContainer())
    }
}
