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
                            .accessibilityLabel("Meal photo")
                    } else {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.csSurface)
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
                        onShowCamera()
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

                TextField("Add description (optional)", text: $viewModel.textDescription, axis: .vertical)
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
            Button("Discard", role: .destructive, action: onDiscard)
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Nothing will be saved.")
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
