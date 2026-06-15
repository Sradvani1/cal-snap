import SwiftUI
import SwiftData

struct WeighInView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @Bindable var viewModel: WeighInViewModel
    let notificationManager: NotificationManager
    let onSaved: (WeighInService.SaveResult) -> Void
    let onSkipped: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        TextField("Weight", value: $viewModel.weightInput, format: .number.precision(.fractionLength(1)))
                            .keyboardType(.decimalPad)
                            .font(.largeTitle.bold())
                            .accessibilityLabel("Weight input")

                        Text(viewModel.useLbs ? "lbs" : "kg")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                    }

                    Picker("Unit", selection: Binding(
                        get: { viewModel.useLbs },
                        set: { viewModel.setUseLbs($0) }
                    )) {
                        Text("lbs").tag(true)
                        Text("kg").tag(false)
                    }
                    .pickerStyle(.segmented)
                }

                Section("Date") {
                    DatePicker("Weigh-in date", selection: $viewModel.selectedDate, displayedComponents: .date)
                }

                Section("Updated targets") {
                    LabeledContent("TDEE") {
                        Text("\(viewModel.previousTDEE) → \(viewModel.previewTDEE) kcal/day")
                    }
                    LabeledContent("Daily target") {
                        Text("Your target adjusts from \(viewModel.previousDailyTarget) to \(viewModel.previewDailyTarget) kcal/day")
                            .multilineTextAlignment(.trailing)
                    }
                }

                if let error = viewModel.saveError {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Log Weight")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Remind me tomorrow") {
                        Task {
                            await notificationManager.snoozeUntilTomorrow(userId: viewModel.userId)
                            onSkipped()
                            dismiss()
                        }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        saveWeighIn()
                    } label: {
                        if viewModel.isSaving {
                            ProgressView()
                        } else {
                            Text("Save")
                        }
                    }
                    .disabled(!viewModel.canSave)
                }
            }
        }
        .interactiveDismissDisabled(viewModel.isSaving)
    }

    private func saveWeighIn() {
        do {
            let result = try viewModel.save(context: modelContext)
            onSaved(result)
            dismiss()
        } catch {
            // saveError set in view model
        }
    }
}

#Preview {
    let profile = UserProfile(
        name: "Alex",
        startingWeightKg: 80,
        dailyCalorieTarget: 2000,
        tdee: 2350,
        deficitKcal: 350
    )
    WeighInView(
        viewModel: WeighInViewModel(
            profile: profile,
            currentWeightKg: 80,
            useLbs: false,
            weighInRepository: WeighInRepository(),
            healthKitService: HealthKitService()
        ),
        notificationManager: NotificationManager(),
        onSaved: { _ in },
        onSkipped: {}
    )
}
