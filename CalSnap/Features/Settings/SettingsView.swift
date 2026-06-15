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

    @State private var weightDisplay = 80.0
    @State private var goalWeightDisplay = 72.0
    @State private var heightFeet = 5
    @State private var heightInches = 9
    @State private var heightCmDisplay = 175.0

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
        .navigationTitle("Settings")
        .task(id: profileDataRevision) {
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
            viewModel?.load(context: modelContext)
            syncDisplayFieldsFromViewModel()
        }
        .sheet(isPresented: $showExportSheet) {
            if let exportShareURL {
                ShareSheet(items: [exportShareURL])
            }
        }
        .alert("Delete all your data?", isPresented: $showDeleteConfirmation) {
            Button("Delete", role: .destructive) {
                deleteAllData()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This permanently removes your profile, meals, and weigh-ins from this device.")
        }
    }

    // MARK: - Sections

    @ViewBuilder
    private func profileSection(viewModel: SettingsViewModel) -> some View {
        Section {
            TextField("Display name (optional)", text: Binding(
                get: { viewModel.draft.name },
                set: { newValue in viewModel.updateDraft { $0.name = newValue } }
            ))
            Text("Used for greetings and export metadata. Leave blank for neutral copy.")
                .font(.caption)
                .foregroundStyle(.secondary)

            Picker("Sex", selection: Binding(
                get: { viewModel.draft.sex },
                set: { newValue in viewModel.updateDraft { $0.sex = newValue } }
            )) {
                Text("Male").tag(BiologicalSex.male)
                Text("Female").tag(BiologicalSex.female)
            }

            DatePicker(
                "Date of birth",
                selection: Binding(
                    get: { viewModel.draft.dateOfBirth },
                    set: { newValue in viewModel.updateDraft { $0.dateOfBirth = newValue } }
                ),
                displayedComponents: .date
            )

            if viewModel.useImperialForHeight {
                HStack {
                    Picker("Feet", selection: $heightFeet) {
                        ForEach(4...7, id: \.self) { Text("\($0) ft").tag($0) }
                    }
                    Picker("Inches", selection: $heightInches) {
                        ForEach(0...11, id: \.self) { Text("\($0) in").tag($0) }
                    }
                }
                .onChange(of: heightFeet) { _, _ in syncHeightToDraft(viewModel) }
                .onChange(of: heightInches) { _, _ in syncHeightToDraft(viewModel) }
            } else {
                Stepper(
                    "Height: \(heightCmDisplay.formatted(.number.precision(.fractionLength(0)))) cm",
                    value: $heightCmDisplay,
                    in: 120...220,
                    step: 1
                )
                .onChange(of: heightCmDisplay) { _, newValue in
                    viewModel.updateDraft { $0.heightCm = newValue }
                }
            }

            Stepper(
                UnitFormatters.stepperWeightLabel(displayValue: weightDisplay, useLbs: viewModel.useLbsForWeight),
                value: $weightDisplay,
                in: viewModel.useLbsForWeight ? 80...400 : 35...180,
                step: viewModel.useLbsForWeight ? 1 : 0.5
            )
            .onChange(of: weightDisplay) { _, newValue in
                viewModel.currentWeightKg = viewModel.useLbsForWeight
                    ? UnitFormatters.lbsToKg(newValue)
                    : newValue
                viewModel.refreshPreview()
            }

            Picker("Activity level", selection: Binding(
                get: { viewModel.draft.activityLevel },
                set: { newValue in viewModel.updateDraft { $0.activityLevel = newValue } }
            )) {
                ForEach(ActivityLevel.allCases, id: \.self) { level in
                    Text(level.rawValue).tag(level)
                }
            }

            Stepper(
                UnitFormatters.stepperGoalWeightLabel(displayValue: goalWeightDisplay, useLbs: viewModel.useLbsForWeight),
                value: $goalWeightDisplay,
                in: viewModel.useLbsForWeight ? 80...400 : 35...180,
                step: viewModel.useLbsForWeight ? 1 : 0.5
            )
            .onChange(of: goalWeightDisplay) { _, newValue in
                viewModel.updateDraft {
                    $0.goalWeightKg = viewModel.useLbsForWeight
                        ? UnitFormatters.lbsToKg(newValue)
                        : newValue
                }
            }

            DatePicker(
                "Goal date",
                selection: Binding(
                    get: { viewModel.draft.goalTargetDate },
                    set: { newValue in viewModel.updateDraft { $0.goalTargetDate = newValue } }
                ),
                displayedComponents: .date
            )

            LabeledContent("TDEE", value: "\(viewModel.previewTDEE) kcal/day")
            LabeledContent("Daily target", value: "\(viewModel.previewTarget) kcal/day")
            LabeledContent("Minimum floor", value: "\(viewModel.minimumCalories) kcal/day")

            Button("Recalculate") {
                viewModel.refreshPreview()
            }

            if let saveError = viewModel.saveError {
                Text(saveError)
                    .font(.caption)
                    .foregroundStyle(Color.csDanger)
            }

            Button(viewModel.isSaving ? "Saving…" : "Save Profile") {
                Task { await viewModel.saveProfile(context: modelContext) }
            }
            .disabled(!viewModel.canSaveProfile)
        } header: {
            Text("Profile")
        }
    }

    @ViewBuilder
    private func macrosSection(viewModel: SettingsViewModel) -> some View {
        Section("Macro Targets") {
            VStack(alignment: .leading) {
                Text("Protein: \(viewModel.macroProteinPct)%")
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
                Text("Carbs: \(viewModel.macroCarbsPct)%")
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
                Text("Fat: \(viewModel.macroFatPct)%")
                Slider(
                    value: Binding(
                        get: { Double(viewModel.macroFatPct) },
                        set: { viewModel.adjustMacro(changed: .fat, newValue: Int($0)) }
                    ),
                    in: 0...100,
                    step: 1
                )
            }
            Text("Total: \(viewModel.macroProteinPct + viewModel.macroCarbsPct + viewModel.macroFatPct)%")
                .foregroundStyle(viewModel.macrosAreValid ? Color.secondary : Color.csDanger)
        }
    }

    @ViewBuilder
    private func apiKeysSection(viewModel: SettingsViewModel) -> some View {
        @Bindable var vm = viewModel
        Section("API Keys") {
            LabeledContent("Gemini", value: vm.geminiKeyConfigured ? "Configured" : "Not set")
            SecureField("Gemini API key", text: $vm.geminiAPIKeyInput)
            HStack {
                Button("Test Key") {
                    Task { await viewModel.testGeminiKey() }
                }
                .disabled(viewModel.geminiTestState == .testing)
                GeminiTestIndicatorView(state: viewModel.geminiTestState)
            }
            Button("Save Gemini Key") {
                saveGeminiAPIKey(viewModel: viewModel)
            }

            LabeledContent("USDA", value: viewModel.usdaKeyConfigured ? "Configured" : "Not set")
            Link("Get a free USDA API key", destination: URL(string: "https://fdc.nal.usda.gov/api-key-signup.html")!)
            SecureField("USDA API key (optional)", text: $vm.usdaAPIKeyInput)
            Button("Save USDA Key") {
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
        Section("Health & Integrations") {
            Toggle("Write meals and weight to Health", isOn: $vm.healthKitWritesEnabled)
                .accessibilityHint("When enabled, logged meals and weigh-ins sync to Apple Health")
                .onChange(of: vm.healthKitWritesEnabled) { _, enabled in
                    vm.persistHealthKitPreferences()
                    if enabled {
                        Task { try? await appContainer.healthKitService.requestAuthorization() }
                    }
                }
            Toggle("Read weight from Health", isOn: $vm.healthKitWeightReadsEnabled)
                .accessibilityHint("When enabled, CalSnap can import body weight from Apple Health")
                .onChange(of: vm.healthKitWeightReadsEnabled) { _, enabled in
                    vm.persistHealthKitPreferences()
                    if enabled {
                        Task { try? await appContainer.healthKitService.requestAuthorization() }
                    }
                }
            Button(viewModel.isSyncing ? "Syncing…" : "Sync Now") {
                Task { await viewModel.syncHealthKitWeight(context: modelContext) }
            }
            .disabled(viewModel.isSyncing)
            .accessibilityHint("Imports the latest body weight from Apple Health")
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
        Section("Notifications") {
            Picker("Weigh-in day", selection: $vm.reminderWeekday) {
                Text("Sunday").tag(1)
                Text("Monday").tag(2)
                Text("Tuesday").tag(3)
                Text("Wednesday").tag(4)
                Text("Thursday").tag(5)
                Text("Friday").tag(6)
                Text("Saturday").tag(7)
            }
            .onChange(of: vm.reminderWeekday) { _, _ in
                Task { await vm.updateReminderSchedule(context: modelContext) }
            }

            DatePicker(
                "Weigh-in time",
                selection: reminderTimeBinding(viewModel: vm),
                displayedComponents: .hourAndMinute
            )
            .onChange(of: vm.reminderHour) { _, _ in
                Task { await vm.updateReminderSchedule(context: modelContext) }
            }
            .onChange(of: vm.reminderMinute) { _, _ in
                Task { await vm.updateReminderSchedule(context: modelContext) }
            }

            Toggle("Daily log reminder", isOn: $vm.dailyLogReminderEnabled)
                .onChange(of: vm.dailyLogReminderEnabled) { _, _ in
                    Task { await vm.updateDailyLogReminderSchedule(context: modelContext) }
                }

            DatePicker(
                "Daily log time",
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
        Section("Units") {
            Toggle("Use lbs for weight", isOn: $vm.useLbsForWeight)
                .onChange(of: vm.useLbsForWeight) { _, useLbs in
                    weightDisplay = useLbs
                        ? UnitFormatters.kgToLbs(vm.currentWeightKg)
                        : vm.currentWeightKg
                    goalWeightDisplay = useLbs
                        ? UnitFormatters.kgToLbs(vm.draft.goalWeightKg)
                        : vm.draft.goalWeightKg
                    vm.persistUnitPreferences()
                }
            Toggle("Use ft/in for height", isOn: $vm.useImperialForHeight)
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
        Section("Data") {
            Button("Export CSV") {
                exportCSV()
            }
            .accessibilityHint("Creates a CSV file with meals and weigh-ins to share")
            Button("Delete All My Data", role: .destructive) {
                showDeleteConfirmation = true
            }
            .accessibilityHint("Permanently deletes your local profile, meals, and weigh-ins")
        }
    }

    private var aboutSection: some View {
        Section("About") {
            if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
               let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String {
                LabeledContent("Version", value: "\(version) (\(build))")
            }
            Link("NIH Body Weight Planner", destination: URL(string: "https://www.niddk.nih.gov/bwp")!)
            Link("USDA Dietary Guidelines", destination: URL(string: "https://www.dietaryguidelines.gov")!)
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

    private func syncDisplayFieldsFromViewModel() {
        guard let viewModel else { return }
        weightDisplay = viewModel.useLbsForWeight
            ? UnitFormatters.kgToLbs(viewModel.currentWeightKg)
            : viewModel.currentWeightKg
        goalWeightDisplay = viewModel.useLbsForWeight
            ? UnitFormatters.kgToLbs(viewModel.draft.goalWeightKg)
            : viewModel.draft.goalWeightKg
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
