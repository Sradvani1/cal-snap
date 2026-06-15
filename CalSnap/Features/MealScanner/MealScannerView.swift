import PhotosUI
import SwiftData
import SwiftUI
import UIKit

struct MealScannerView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let userId: UUID
    let route: MealScannerRoute
    var onMealSaved: (() -> Void)? = nil

    @State private var viewModel: MealScannerViewModel?
    @State private var editLoadFailed = false
    @State private var showCamera = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var showDiscardAlert = false
    @State private var showBackConfirmAlert = false
    @State private var didApplyRoute = false

    var body: some View {
        Group {
            if editLoadFailed {
                ContentUnavailableView(
                    "mealLog.detail.notFound.title",
                    systemImage: "fork.knife.circle",
                    description: Text("mealLog.detail.notFound.message")
                )
            } else if let viewModel {
                scannerContent(viewModel: viewModel)
            } else {
                ProgressView()
            }
        }
        .navigationTitle(viewModel?.isEditing == true ? "mealScanner.title.edit" : "mealScanner.title.scan")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(viewModel?.hasUnsavedWork == true)
        .toolbar {
            if let viewModel, viewModel.hasUnsavedWork {
                ToolbarItem(placement: .topBarLeading) {
                    Button("common.button.back", systemImage: "chevron.backward") {
                        showBackConfirmAlert = true
                    }
                }
            }
        }
        .alert(
            viewModel?.isEditing == true
                ? String(localized: "mealScanner.alert.discardChanges.title")
                : String(localized: "mealScanner.alert.discardMeal.title"),
            isPresented: $showBackConfirmAlert
        ) {
            Button(
                viewModel?.isEditing == true
                    ? String(localized: "mealScanner.alert.discardChanges.action")
                    : String(localized: "common.button.discard"),
                role: .destructive
            ) {
                if viewModel?.isEditing != true {
                    viewModel?.discard()
                }
                dismiss()
            }
            Button("common.button.cancel", role: .cancel) {}
        } message: {
            Text(
                viewModel?.isEditing == true
                    ? "mealScanner.alert.discardChanges.message"
                    : "mealScanner.alert.discardMeal.message"
            )
        }
        .task {
            if viewModel == nil {
                viewModel = MealScannerViewModel(
                    userId: userId,
                    mealAnalyzer: appContainer.geminiService,
                    healthKitService: appContainer.healthKitService,
                    mealRepository: appContainer.mealRepository
                )
            }
            applyRouteIfNeeded()
        }
        .onDisappear {
            viewModel?.cancelAnalysis()
        }
        .background {
            InteractivePopGestureDisabler(isDisabled: viewModel?.hasUnsavedWork == true)
        }
    }

    @ViewBuilder
    private func scannerContent(viewModel: MealScannerViewModel) -> some View {
        ZStack {
            switch viewModel.phase {
            case .capture, .error:
                MealScannerCaptureView(
                    viewModel: viewModel,
                    selectedPhotoItem: $selectedPhotoItem,
                    showDiscardAlert: $showDiscardAlert,
                    onShowCamera: { showCamera = true },
                    onDiscard: {
                        viewModel.discard()
                        dismiss()
                    }
                )
            case .analyzing:
                MealScannerAnalyzingView()
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
        .sheet(item: editingItemBinding(viewModel)) { selection in
            if let item = viewModel.editableItems.first(where: { $0.id == selection.id }) {
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
            } else {
                Color.clear
                    .onAppear { viewModel.editingItemID = nil }
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraImagePicker { image in
                if viewModel.setSelectedPhoto(from: image) {
                    viewModel.scannerError = nil
                } else {
                    viewModel.scannerError = .unrecognizable
                    viewModel.phase = .error
                }
            }
        }
        .onChange(of: selectedPhotoItem) { _, newItem in
            Task {
                guard let newItem else { return }
                if let data = try? await newItem.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    if viewModel.setSelectedPhoto(from: image) {
                        viewModel.scannerError = nil
                    } else {
                        viewModel.scannerError = .unrecognizable
                        viewModel.phase = .error
                    }
                    selectedPhotoItem = nil
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
                viewModel.logError = String(localized: "mealScanner.error.saveFailed")
                print("Failed to save meal: \(error.localizedDescription)")
            }
            viewModel.isLogging = false
        }
    }

    private func editingItemBinding(_ viewModel: MealScannerViewModel) -> Binding<EditingFoodItemID?> {
        Binding(
            get: {
                viewModel.editingItemID.map { EditingFoodItemID(id: $0) }
            },
            set: { newValue in
                viewModel.editingItemID = newValue?.id
            }
        )
    }
}

#Preview {
    NavigationStack {
        MealScannerView(
            userId: UUID(),
            route: .create(initialMealType: nil)
        )
        .environment(AppContainer())
    }
}
