import SwiftData
import SwiftUI

struct OnboardingNavigationBar: View {
    @Bindable var viewModel: OnboardingViewModel
    let modelContext: ModelContext

    var body: some View {
        HStack {
            if viewModel.currentStep != .welcome && viewModel.currentStep != .done {
                Button("Back", action: viewModel.goBack)
            }

            Spacer()

            if viewModel.currentStep == .healthKit {
                Button("Continue") {
                    Task {
                        await viewModel.requestHealthKit()
                        viewModel.advanceOrSetValidationError(context: modelContext)
                    }
                }
                .buttonStyle(.borderedProminent)
            } else if viewModel.currentStep == .apiKeys {
                Button("Continue") {
                    viewModel.advanceOrSetValidationError(context: modelContext)
                }
                .buttonStyle(.borderedProminent)
            } else if viewModel.currentStep != .done {
                Button("Continue") {
                    viewModel.advanceOrSetValidationError(context: modelContext)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }
}
