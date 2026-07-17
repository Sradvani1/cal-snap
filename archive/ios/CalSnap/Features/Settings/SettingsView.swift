import SwiftData
import SwiftUI

struct SettingsView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @AppStorage(AppStorageKey.profileDataRevision) private var profileDataRevision = 0

    @State private var viewModel: SettingsViewModel?
    @State private var showDeleteConfirmation = false
    @State private var showExportSheet = false
    @State private var exportShareURL: URL?

    @State private var heightFeet = 5
    @State private var heightInches = 9
    @State private var heightCmDisplay = 175.0
    @State private var loadedProfileRevision = -1

    var body: some View {
        Form {
            if let viewModel {
                profileSection(viewModel: viewModel)
                macrosSection(viewModel: viewModel)
                apiKeysSection(viewModel: viewModel)
                healthSection(viewModel: viewModel)
                notificationsSection(viewModel: viewModel)
                unitsSection(viewModel: viewModel)
                dataSection(viewModel: viewModel)
                aboutSection
            } else {
                Section {
                    ProgressView()
                }
            }
        }
        .navigationTitle("settings.title")
        .task {
            if viewModel == nil {
                viewModel = SettingsViewModel(
                    userProfileRepository: appContainer.userProfileRepository,
                    mealRepository: appContainer.mealRepository,
                    weighInRepository: appContainer.weighInRepository,
                    healthKitService: appContainer.healthKitService,
                    geminiService: appContainer.geminiService,
                    notificationManager: appContainer.notificationManager
                )
            }
            loadSettingsIfNeeded()
        }
        .onChange(of: profileDataRevision) { _, newRevision in
            loadSettingsIfNeeded(expectedRevision: newRevision)
        }
        .onDisappear {
            guard let viewModel, viewModel.canSaveProfile else { return }
            Task {
                await viewModel.saveProfile(context: modelContext)
            }
        }
        .sheet(isPresented: $showExportSheet) {
            if let exportShareURL {
                ShareSheet(items: [exportShareURL])
            }
        }
        .alert("settings.alert.deleteAll.title", isPresented: $showDeleteConfirmation) {
            Button("common.button.delete", role: .destructive) {
                deleteAllData()
            }
            Button("common.button.cancel", role: .cancel) {}
        } message: {
            Text("settings.alert.deleteAll.message")
        }
    }

    // MARK: - Sections

    @ViewBuilder
    private func profileSection(viewModel: SettingsViewModel) -> some View {
        Section {
            TextField("settings.profile.displayName", text: Binding(
                get: { viewModel.draft.name },
                set: { newValue in viewModel.updateDraft { $0.name = newValue } }
            ))
            Text("settings.profile.displayNameHint")
                .font(.caption)
                .foregroundStyle(.secondary)

            Picker("settings.profile.sex", selection: Binding(
                get: { viewModel.draft.sex },
                set: { newValue in viewModel.updateDraft { $0.sex = newValue } }
            )) {
                Text("model.biologicalSex.male").tag(BiologicalSex.male)
                Text("model.biologicalSex.female").tag(BiologicalSex.female)
            }

            DatePicker(
                "settings.profile.dateOfBirth",
                selection: Binding(
                    get: { viewModel.draft.dateOfBirth },
                    set: { newValue in viewModel.updateDraft { $0.dateOfBirth = newValue } }
                ),
                displayedComponents: .date
            )

            if viewModel.useImperialForHeight {
                HStack {
                    Picker("units.height.feet", selection: $heightFeet) {
                        ForEach(4...7, id: \.self) { ft in
                            Text(String(format: String(localized: "units.height.feetValue"), ft)).tag(ft)
                        }
                    }
                    Picker("units.height.inches", selection: $heightInches) {
                        ForEach(0...11, id: \.self) { inch in
                            Text(String(format: String(localized: "units.height.inchesValue"), inch)).tag(inch)
                        }
                    }
                }
                .onChange(of: heightFeet) { _, _ in syncHeightToDraft(viewModel) }
                .onChange(of: heightInches) { _, _ in syncHeightToDraft(viewModel) }
            } else {
                Stepper(
                    String(format: String(localized: "settings.profile.heightCm"), heightCmDisplay.formatted(.number.precision(.fractionLength(0)))),
                    value: $heightCmDisplay,
                    in: 120...220,
                    step: 1
                )
                .onChange(of: heightCmDisplay) { _, newValue in
                    viewModel.updateDraft { $0.heightCm = newValue }
                }
            }

            Stepper(
                UnitFormatters.stepperWeightLabel(
                    displayValue: weightStepperBinding(viewModel: viewModel).wrappedValue,
                    useLbs: viewModel.useLbsForWeight
                ),
                value: weightStepperBinding(viewModel: viewModel),
                in: UnitFormatters.weightDisplayRange(useLbs: viewModel.useLbsForWeight),
                step: UnitFormatters.weightDisplayStep(useLbs: viewModel.useLbsForWeight)
            )
            .id(viewModel.useLbsForWeight)

            Picker("settings.profile.activityLevel", selection: Binding(
                get: { viewModel.draft.activityLevel },
                set: { newValue in viewModel.updateDraft { $0.activityLevel = newValue } }
            )) {
                ForEach(ActivityLevel.allCases, id: \.self) { level in
                    Text(level.localizedTitle).tag(level)
                }
            }

            Stepper(
                UnitFormatters.stepperGoalWeightLabel(
                    displayValue: goalWeightStepperBinding(viewModel: viewModel).wrappedValue,
                    useLbs: viewModel.useLbsForWeight
                ),
                value: goalWeightStepperBinding(viewModel: viewModel),
                in: UnitFormatters.weightDisplayRange(useLbs: viewModel.useLbsForWeight),
                step: UnitFormatters.weightDisplayStep(useLbs: viewModel.useLbsForWeight)
            )
            .id("goal-\(viewModel.useLbsForWeight)")

            DatePicker(
                "settings.profile.goalDate",
                selection: Binding(
                    get: { viewModel.draft.goalTargetDate },
                    set: { newValue in viewModel.updateDraft { $0.goalTargetDate = newValue } }
                ),
                displayedComponents: .date
            )

            LabeledContent("settings.profile.tdee", value: String(format: String(localized: "units.kcalPerDay"), viewModel.previewTDEE))
            LabeledContent("settings.profile.dailyTarget", value: String(format: String(localized: "units.kcalPerDay"), viewModel.previewTarget))
            LabeledContent("settings.profile.minimumFloor", value: String(format: String(localized: "units.kcalPerDay"), viewModel.minimumCalories))

            Button("settings.profile.recalculate") {
                viewModel.refreshPreview()
            }

            if let saveError = viewModel.saveError {
                Text(saveError)
                    .font(.caption)
                    .foregroundStyle(Color.csDanger)
            }

            Button(viewModel.isSaving ? "common.status.saving" : "settings.profile.save") {
                Task { await viewModel.saveProfile(context: modelContext) }
            }
            .disabled(!viewModel.canSaveProfile)
        } header: {
            Text("settings.section.profile")
        }
    }

    @ViewBuilder
    private func macrosSection(viewModel: SettingsViewModel) -> some View {
        Section("settings.section.macroTargets") {
            VStack(alignment: .leading) {
                Text(String(format: String(localized: "settings.macro.protein"), viewModel.macroProteinPct))
                Slider(
                    value: Binding(
                        get: { Double(viewModel.macroProteinPct) },
                        set: { viewModel.adjustMacro(changed: .protein, newValue: Int($0)) }
                    ),
                    in: 0...100,
                    step: 1
                )
            }
            VStack(alignment: .leading) {
                Text(String(format: String(localized: "settings.macro.carbs"), viewModel.macroCarbsPct))
                Slider(
                    value: Binding(
                        get: { Double(viewModel.macroCarbsPct) },
                        set: { viewModel.adjustMacro(changed: .carbs, newValue: Int($0)) }
                    ),
                    in: 0...100,
                    step: 1
                )
            }
            VStack(alignment: .leading) {
                Text(String(format: String(localized: "settings.macro.fat"), viewModel.macroFatPct))
                Slider(
                    value: Binding(
                        get: { Double(viewModel.macroFatPct) },
                        set: { viewModel.adjustMacro(changed: .fat, newValue: Int($0)) }
                    ),
                    in: 0...100,
                    step: 1
                )
            }
            Text(String(format: String(localized: "settings.macro.total"), viewModel.macroProteinPct + viewModel.macroCarbsPct + viewModel.macroFatPct))
                .foregroundStyle(viewModel.macrosAreValid ? Color.secondary : Color.csDanger)
        }
    }

    @ViewBuilder
    private func apiKeysSection(viewModel: SettingsViewModel) -> some View {
        @Bindable var vm = viewModel
        Section("settings.section.apiKeys") {
            LabeledContent(
                "settings.apiKeys.gemini",
                value: vm.geminiKeyConfigured
                    ? String(localized: "settings.apiKeys.configured")
                    : String(localized: "settings.apiKeys.notSet")
            )
            SecureField("settings.apiKeys.geminiField", text: $vm.geminiAPIKeyInput)
            HStack {
                Button("settings.apiKeys.testKey") {
                    Task { await viewModel.testGeminiKey() }
                }
                .disabled(viewModel.geminiTestState == .testing)
                GeminiTestIndicatorView(state: viewModel.geminiTestState)
            }
            Button("settings.apiKeys.saveGemini") {
                saveGeminiAPIKey(viewModel: viewModel)
            }

            LabeledContent(
                "settings.apiKeys.usda",
                value: viewModel.usdaKeyConfigured
                    ? String(localized: "settings.apiKeys.configured")
                    : String(localized: "settings.apiKeys.notSet")
            )
            Link("settings.apiKeys.usdaSignup", destination: URL(string: "https://fdc.nal.usda.gov/api-key-signup.html")!)
            SecureField("settings.apiKeys.usdaFieldOptional", text: $vm.usdaAPIKeyInput)
            Button("settings.apiKeys.saveUsda") {
                saveUSDAAPIKey(viewModel: viewModel)
            }

            if let apiKeyError = viewModel.apiKeyError {
                Text(apiKeyError)
                    .font(.caption)
                    .foregroundStyle(Color.csDanger)
            }
        }
    }

    @ViewBuilder
    private func healthSection(viewModel: SettingsViewModel) -> some View {
        @Bindable var vm = viewModel
        Section("settings.section.health") {
            Toggle("settings.health.writeToggle", isOn: $vm.healthKitWritesEnabled)
                .accessibilityHint("settings.health.writeHint")
                .onChange(of: vm.healthKitWritesEnabled) { _, enabled in
                    vm.persistHealthKitPreferences()
                    if enabled {
                        Task { try? await appContainer.healthKitService.requestAuthorization() }
                    }
                }
            Toggle("settings.health.readToggle", isOn: $vm.healthKitWeightReadsEnabled)
                .accessibilityHint("settings.health.readHint")
                .onChange(of: vm.healthKitWeightReadsEnabled) { _, enabled in
                    vm.persistHealthKitPreferences()
                    if enabled {
                        Task { try? await appContainer.healthKitService.requestAuthorization() }
                    }
                }
            Button(viewModel.isSyncing ? "common.status.syncing" : "settings.health.syncNow") {
                Task { await viewModel.syncHealthKitWeight(context: modelContext) }
            }
            .disabled(viewModel.isSyncing)
            .accessibilityHint("settings.health.syncHint")
            if let message = viewModel.syncMessage {
                Text(message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private func notificationsSection(viewModel: SettingsViewModel) -> some View {
        @Bindable var vm = viewModel
        Section("settings.section.notifications") {
            Picker("settings.notifications.weighInDay", selection: $vm.reminderWeekday) {
                Text("common.weekday.sunday").tag(1)
                Text("common.weekday.monday").tag(2)
                Text("common.weekday.tuesday").tag(3)
                Text("common.weekday.wednesday").tag(4)
                Text("common.weekday.thursday").tag(5)
                Text("common.weekday.friday").tag(6)
                Text("common.weekday.saturday").tag(7)
            }
            .onChange(of: vm.reminderWeekday) { _, _ in
                Task { await vm.updateReminderSchedule(context: modelContext) }
            }

            DatePicker(
                "settings.notifications.weighInTime",
                selection: reminderTimeBinding(viewModel: vm),
                displayedComponents: .hourAndMinute
            )
            .onChange(of: vm.reminderHour) { _, _ in
                Task { await vm.updateReminderSchedule(context: modelContext) }
            }
            .onChange(of: vm.reminderMinute) { _, _ in
                Task { await vm.updateReminderSchedule(context: modelContext) }
            }

            Toggle("settings.notifications.dailyLogReminder", isOn: $vm.dailyLogReminderEnabled)
                .onChange(of: vm.dailyLogReminderEnabled) { _, _ in
                    Task { await vm.updateDailyLogReminderSchedule(context: modelContext) }
                }

            DatePicker(
                "settings.notifications.dailyLogTime",
                selection: dailyLogTimeBinding(viewModel: vm),
                displayedComponents: .hourAndMinute
            )
            .disabled(!vm.dailyLogReminderEnabled)
            .onChange(of: vm.dailyLogReminderHour) { _, _ in
                Task { await vm.updateDailyLogReminderSchedule(context: modelContext) }
            }
            .onChange(of: vm.dailyLogReminderMinute) { _, _ in
                Task { await vm.updateDailyLogReminderSchedule(context: modelContext) }
            }
        }
    }

    @ViewBuilder
    private func unitsSection(viewModel: SettingsViewModel) -> some View {
        @Bindable var vm = viewModel
        Section("settings.section.units") {
            Toggle("settings.units.useLbs", isOn: useLbsForWeightBinding(viewModel: viewModel))
            Toggle("settings.units.useImperialHeight", isOn: $vm.useImperialForHeight)
                .onChange(of: vm.useImperialForHeight) { _, useImperial in
                    if useImperial {
                        let parts = UnitFormatters.cmToFeetInches(vm.draft.heightCm)
                        heightFeet = parts.feet
                        heightInches = parts.inches
                    } else {
                        heightCmDisplay = vm.draft.heightCm
                    }
                    vm.persistUnitPreferences()
                }
        }
    }

    @ViewBuilder
    private func dataSection(viewModel: SettingsViewModel) -> some View {
        Section("settings.section.data") {
            Button("settings.data.exportCsv") {
                exportCSV()
            }
            .accessibilityHint("settings.data.exportHint")
            Button("settings.data.deleteAll", role: .destructive) {
                showDeleteConfirmation = true
            }
            .accessibilityHint("settings.data.deleteHint")
        }
    }

    private var aboutSection: some View {
        Section("settings.section.about") {
            if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
               let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String {
                LabeledContent(
                    "settings.about.version",
                    value: String(format: String(localized: "settings.about.versionFormat"), version, build)
                )
            }
            Link("settings.about.nihPlanner", destination: URL(string: "https://www.niddk.nih.gov/bwp")!)
            Link("settings.about.usdaGuidelines", destination: URL(string: "https://www.dietaryguidelines.gov")!)
        }
    }

    // MARK: - Helpers

    private func reminderTimeBinding(viewModel: SettingsViewModel) -> Binding<Date> {
        Binding(
            get: {
                var components = DateComponents()
                components.hour = viewModel.reminderHour
                components.minute = viewModel.reminderMinute
                return Calendar.current.date(from: components) ?? Date.now
            },
            set: { newValue in
                let components = Calendar.current.dateComponents([.hour, .minute], from: newValue)
                viewModel.reminderHour = components.hour ?? AppConstants.Notifications.defaultReminderHour
                viewModel.reminderMinute = components.minute ?? AppConstants.Notifications.defaultReminderMinute
            }
        )
    }

    private func dailyLogTimeBinding(viewModel: SettingsViewModel) -> Binding<Date> {
        Binding(
            get: {
                var components = DateComponents()
                components.hour = viewModel.dailyLogReminderHour
                components.minute = viewModel.dailyLogReminderMinute
                return Calendar.current.date(from: components) ?? Date.now
            },
            set: { newValue in
                let components = Calendar.current.dateComponents([.hour, .minute], from: newValue)
                viewModel.dailyLogReminderHour = components.hour ?? AppConstants.Notifications.defaultDailyLogReminderHour
                viewModel.dailyLogReminderMinute = components.minute ?? AppConstants.Notifications.defaultDailyLogReminderMinute
            }
        )
    }

    private func useLbsForWeightBinding(viewModel: SettingsViewModel) -> Binding<Bool> {
        Binding(
            get: { viewModel.useLbsForWeight },
            set: { useLbs in
                viewModel.useLbsForWeight = useLbs
                viewModel.persistUnitPreferences()
            }
        )
    }

    private func weightStepperBinding(viewModel: SettingsViewModel) -> Binding<Double> {
        Binding(
            get: {
                UnitFormatters.displayWeight(fromKg: viewModel.currentWeightKg, useLbs: viewModel.useLbsForWeight)
            },
            set: { newValue in
                let snapped = UnitFormatters.snappedDisplayWeight(newValue, useLbs: viewModel.useLbsForWeight)
                viewModel.currentWeightKg = UnitFormatters.kgFromDisplayWeight(snapped, useLbs: viewModel.useLbsForWeight)
                viewModel.refreshPreview()
                Task { await viewModel.saveProfile(context: modelContext) }
            }
        )
    }

    private func goalWeightStepperBinding(viewModel: SettingsViewModel) -> Binding<Double> {
        Binding(
            get: {
                UnitFormatters.displayWeight(fromKg: viewModel.draft.goalWeightKg, useLbs: viewModel.useLbsForWeight)
            },
            set: { newValue in
                let snapped = UnitFormatters.snappedDisplayWeight(newValue, useLbs: viewModel.useLbsForWeight)
                viewModel.updateDraft {
                    $0.goalWeightKg = UnitFormatters.kgFromDisplayWeight(snapped, useLbs: viewModel.useLbsForWeight)
                }
                Task { await viewModel.saveProfile(context: modelContext) }
            }
        )
    }

    private func loadSettingsIfNeeded(expectedRevision: Int? = nil) {
        let revision = expectedRevision ?? profileDataRevision
        guard revision != loadedProfileRevision else { return }
        viewModel?.load(context: modelContext)
        syncDisplayFieldsFromViewModel()
        loadedProfileRevision = revision
    }

    private func syncDisplayFieldsFromViewModel() {
        guard let viewModel else { return }
        if viewModel.useImperialForHeight {
            let parts = UnitFormatters.cmToFeetInches(viewModel.draft.heightCm)
            heightFeet = parts.feet
            heightInches = parts.inches
        } else {
            heightCmDisplay = viewModel.draft.heightCm
        }
    }

    private func syncHeightToDraft(_ viewModel: SettingsViewModel) {
        viewModel.updateDraft {
            $0.heightCm = UnitFormatters.feetInchesToCm(feet: heightFeet, inches: heightInches)
        }
    }

    private func saveGeminiAPIKey(viewModel: SettingsViewModel) {
        do {
            try viewModel.saveGeminiAPIKey()
        } catch {
            viewModel.apiKeyError = error.localizedDescription
        }
    }

    private func saveUSDAAPIKey(viewModel: SettingsViewModel) {
        do {
            try viewModel.saveUSDAAPIKey()
        } catch {
            viewModel.apiKeyError = error.localizedDescription
        }
    }

    private func exportCSV() {
        guard let viewModel else { return }
        do {
            exportShareURL = try viewModel.makeExportURL(context: modelContext)
            showExportSheet = true
        } catch {
            viewModel.saveError = error.localizedDescription
        }
    }

    private func deleteAllData() {
        guard let viewModel else { return }
        do {
            try viewModel.deleteAllUserData(context: modelContext)
        } catch {
            viewModel.saveError = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
    .environment(AppContainer())
    .modelContainer(for: [UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self], inMemory: true)
}
