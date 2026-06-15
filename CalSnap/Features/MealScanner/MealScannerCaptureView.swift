import PhotosUI
import SwiftUI
import UIKit

struct MealScannerCaptureView: View {
    @Bindable var viewModel: MealScannerViewModel
    @Binding var selectedPhotoItem: PhotosPickerItem?
    @Binding var showDiscardAlert: Bool
    let onShowCamera: () -> Void
    let onDiscard: () -> Void

    var body: some View {
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
                            .accessibilityLabel("mealLog.photo.accessibility")
                    } else {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.csSurface)
                            .frame(height: 220)
                            .overlay {
                                VStack(spacing: 8) {
                                    Image(systemName: "photo")
                                        .font(.largeTitle)
                                        .foregroundStyle(.secondary)
                                    Text("mealScanner.capture.addPhoto")
                                        .foregroundStyle(.secondary)
                                }
                            }
                    }
                }

                if MealScannerViewModel.isCameraAvailable {
                    Button {
                        onShowCamera()
                    } label: {
                        Label("mealScanner.capture.takePhoto", systemImage: "camera")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                } else {
                    Text("mealScanner.capture.noCamera")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                    Label("mealScanner.capture.chooseLibrary", systemImage: "photo.on.rectangle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                TextField("mealScanner.capture.descriptionField", text: $viewModel.textDescription, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)

                if !viewModel.hasGeminiAPIKey {
                    Text("error.gemini.apiKeyMissing")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Button("mealScanner.capture.analyze") {
                    viewModel.analyze()
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
                .disabled(!viewModel.canAnalyze)

                Button("mealScanner.capture.enterManually") {
                    viewModel.enterManualEntry()
                }
                .frame(maxWidth: .infinity)

                Button("common.button.discard", role: .destructive) {
                    showDiscardAlert = true
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
        }
        .alert("mealScanner.alert.discardMeal.title", isPresented: $showDiscardAlert) {
            Button("common.button.discard", role: .destructive, action: onDiscard)
            Button("common.button.cancel", role: .cancel) {}
        } message: {
            Text("mealScanner.alert.discardMeal.message")
        }
    }
}

#Preview {
    MealScannerCaptureView(
        viewModel: MealScannerViewModel(
            userId: UUID(),
            mealAnalyzer: MockMealAnalyzer(),
            healthKitService: HealthKitService(),
            mealRepository: MealRepository()
        ),
        selectedPhotoItem: .constant(nil),
        showDiscardAlert: .constant(false),
        onShowCamera: {},
        onDiscard: {}
    )
}
