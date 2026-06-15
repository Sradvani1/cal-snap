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
                        TextField("progress.weighIn.weightField", value: $viewModel.weightInput, format: .number.precision(.fractionLength(1)))
                            .keyboardType(.decimalPad)
                            .font(.largeTitle.bold())
                            .accessibilityLabel("progress.weighIn.weightInput")

                        Text(viewModel.useLbs ? String(localized: "units.lbs") : String(localized: "units.kg"))
                            .font(.title3)
                            .foregroundStyle(.secondary)
                    }

                    Picker("progress.weighIn.unit", selection: Binding(
                        get: { viewModel.useLbs },
                        set: { viewModel.setUseLbs($0) }
                    )) {
                        Text("units.lbs").tag(true)
                        Text("units.kg").tag(false)
                    }
                    .pickerStyle(.segmented)
                }

                Section("common.label.date") {
                    DatePicker("progress.weighIn.date", selection: $viewModel.selectedDate, displayedComponents: .date)
                }

                Section("progress.weighIn.updatedTargets") {
                    LabeledContent("settings.profile.tdee") {
                        Text(String(format: String(localized: "progress.weighIn.tdeeChange"), viewModel.previousTDEE, viewModel.previewTDEE))
                    }
                    LabeledContent("settings.profile.dailyTarget") {
                        Text(String(format: String(localized: "progress.weighIn.targetChange"), viewModel.previousDailyTarget, viewModel.previewDailyTarget))
                            .multilineTextAlignment(.trailing)
                    }
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel(viewModel.targetsAccessibilitySummary)

                if let error = viewModel.saveError {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("progress.weighIn.navigationTitle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("progress.weighIn.remindTomorrow") {
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
                            Text("common.button.save")
                        }
                    }
                    .disabled(!viewModel.canSave)
                    .accessibilityLabel(viewModel.isSaving ? "common.status.savingVerb" : "common.button.save")
                }
            }
        }
        .presentationSizing(.form)
        .interactiveDismissDisabled(viewModel.isSaving)
        .onChange(of: viewModel.weightInput) {
            viewModel.weightInputDidChange()
        }
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
