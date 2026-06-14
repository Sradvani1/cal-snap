import SwiftUI

struct ProfileSetupStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    @State private var heightFeet = 5
    @State private var heightInches = 9
    @State private var weightDisplay = 80.0
    @State private var dobRange: ClosedRange<Date> = {
        let calendar = Calendar.current
        let maxDOB = calendar.date(byAdding: .year, value: -AppConstants.Onboarding.minAgeYears, to: Date()) ?? Date()
        let minDOB = calendar.date(byAdding: .year, value: -AppConstants.Onboarding.maxAgeYears, to: Date()) ?? Date()
        return minDOB...maxDOB
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(viewModel.activeProfileTitle)
                .font(.title2.bold())

            TextField("Name", text: nameBinding)
                .textFieldStyle(.roundedBorder)

            Picker("Sex", selection: sexBinding) {
                Text("Male").tag(BiologicalSex.male)
                Text("Female").tag(BiologicalSex.female)
            }
            .pickerStyle(.segmented)

            DatePicker(
                "Date of birth",
                selection: dobBinding,
                in: dobRange,
                displayedComponents: .date
            )

            Toggle("Use ft/in for height", isOn: $viewModel.useImperialHeight)
                .onChange(of: viewModel.useImperialHeight) { _, useImperial in
                    syncHeightFromProfile(useImperial: useImperial)
                }

            if viewModel.useImperialHeight {
                HStack {
                    Picker("Feet", selection: $heightFeet) {
                        ForEach(4...7, id: \.self) { Text("\($0) ft").tag($0) }
                    }
                    Picker("Inches", selection: $heightInches) {
                        ForEach(0...11, id: \.self) { Text("\($0) in").tag($0) }
                    }
                }
                .onChange(of: heightFeet) { _, _ in updateHeightCm() }
                .onChange(of: heightInches) { _, _ in updateHeightCm() }
            } else {
                Stepper(
                    "Height: \(Int(viewModel.activeProfile.heightCm)) cm",
                    value: heightCmBinding,
                    in: 120...220,
                    step: 1
                )
            }

            Toggle("Use lbs for weight", isOn: $viewModel.useLbsWeight)
                .onChange(of: viewModel.useLbsWeight) { _, useLbs in
                    syncWeightFromProfile(useLbs: useLbs)
                }

            Stepper(
                weightLabel,
                value: $weightDisplay,
                in: viewModel.useLbsWeight ? 80...400 : 35...180,
                step: viewModel.useLbsWeight ? 1 : 0.5
            )
            .onChange(of: weightDisplay) { _, newValue in
                var draft = viewModel.activeProfile
                draft.weightKg = viewModel.useLbsWeight
                    ? UnitFormatters.lbsToKg(newValue)
                    : newValue
                viewModel.activeProfile = draft
            }
        }
        .onAppear {
            syncHeightFromProfile(useImperial: viewModel.useImperialHeight)
            syncWeightFromProfile(useLbs: viewModel.useLbsWeight)
        }
    }

    private var nameBinding: Binding<String> {
        Binding(
            get: { viewModel.activeProfile.name },
            set: { newValue in
                var draft = viewModel.activeProfile
                draft.name = newValue
                viewModel.activeProfile = draft
            }
        )
    }

    private var sexBinding: Binding<BiologicalSex> {
        Binding(
            get: { viewModel.activeProfile.sex },
            set: { newValue in
                var draft = viewModel.activeProfile
                draft.sex = newValue
                viewModel.activeProfile = draft
            }
        )
    }

    private var dobBinding: Binding<Date> {
        Binding(
            get: { viewModel.activeProfile.dateOfBirth },
            set: { newValue in
                var draft = viewModel.activeProfile
                draft.dateOfBirth = newValue
                viewModel.activeProfile = draft
            }
        )
    }

    private var heightCmBinding: Binding<Double> {
        Binding(
            get: { viewModel.activeProfile.heightCm },
            set: { newValue in
                var draft = viewModel.activeProfile
                draft.heightCm = newValue
                viewModel.activeProfile = draft
            }
        )
    }

    private var weightLabel: String {
        if viewModel.useLbsWeight {
            return String(format: "Weight: %.0f lbs", weightDisplay)
        }
        return String(format: "Weight: %.1f kg", weightDisplay)
    }

    private func syncHeightFromProfile(useImperial: Bool) {
        if useImperial {
            let parts = UnitFormatters.cmToFeetInches(viewModel.activeProfile.heightCm)
            heightFeet = parts.feet
            heightInches = parts.inches
        }
    }

    private func syncWeightFromProfile(useLbs: Bool) {
        weightDisplay = useLbs
            ? UnitFormatters.kgToLbs(viewModel.activeProfile.weightKg)
            : viewModel.activeProfile.weightKg
    }

    private func updateHeightCm() {
        var draft = viewModel.activeProfile
        draft.heightCm = UnitFormatters.feetInchesToCm(feet: heightFeet, inches: heightInches)
        viewModel.activeProfile = draft
    }
}

#Preview {
    ProfileSetupStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
