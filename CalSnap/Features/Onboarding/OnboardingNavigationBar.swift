import SwiftData
import SwiftUI

struct OnboardingNavigationBar: View {
    @Bindable var viewModel: OnboardingViewModel
    let modelContext: ModelContext

    var body: some View {
        HStack {
            if viewModel.currentStep != .welcome && viewModel.currentStep != .done {
                Button("common.button.back", action: viewModel.goBack)
            }

            Spacer()

            if viewModel.currentStep == .healthKit {
                Button("common.button.continue") {
                    Task {
                        await viewModel.requestHealthKit()
                        viewModel.advanceOrSetValidationError(context: modelContext)
                    }
                }
                .buttonStyle(.borderedProminent)
            } else if viewModel.currentStep == .apiKeys {
                Button("common.button.continue") {
                    viewModel.advanceOrSetValidationError(context: modelContext)
                }
                .buttonStyle(.borderedProminent)
            } else if viewModel.currentStep != .done {
                Button("common.button.continue") {
                    viewModel.advanceOrSetValidationError(context: modelContext)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }
}
