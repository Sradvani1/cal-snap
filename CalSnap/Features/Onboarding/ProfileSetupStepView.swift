import SwiftUI

struct ProfileSetupStepView: View {
    @Bindable var viewModel: OnboardingViewModel

    @State private var heightFeet = 5
    @State private var heightInches = 9
    @State private var weightDisplay = 80.0
    @State private var dobRange: ClosedRange<Date> = {
        let calendar = Calendar.current
        let maxDOB = calendar.date(byAdding: .year, value: -AppConstants.Onboarding.minAgeYears, to: Date.now) ?? Date.now
        let minDOB = calendar.date(byAdding: .year, value: -AppConstants.Onboarding.maxAgeYears, to: Date.now) ?? Date.now
        return minDOB...maxDOB
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(viewModel.activeProfileTitle)
                .font(.title2.bold())

            TextField("Name", text: viewModel.binding(\.name))
                .textFieldStyle(.roundedBorder)

            Picker("Sex", selection: viewModel.binding(\.sex)) {
                Text("Male").tag(BiologicalSex.male)
                Text("Female").tag(BiologicalSex.female)
            }
            .pickerStyle(.segmented)

            DatePicker(
                "Date of birth",
                selection: viewModel.binding(\.dateOfBirth),
                in: dobRange,
                displayedComponents: .date
            )

            Toggle("Use ft/in for height", isOn: viewModel.binding(\.useImperialHeight))
                .onChange(of: viewModel.activeProfile.useImperialHeight) { _, useImperial in
                    syncHeightFromProfile(useImperial: useImperial)
                }

            if viewModel.activeProfile.useImperialHeight {
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
                    value: viewModel.binding(\.heightCm),
                    in: 120...220,
                    step: 1
                )
            }

            Toggle("Use lbs for weight", isOn: viewModel.binding(\.useLbsWeight))
                .onChange(of: viewModel.activeProfile.useLbsWeight) { _, useLbs in
                    syncWeightFromProfile(useLbs: useLbs)
                }

            Stepper(
                UnitFormatters.stepperWeightLabel(
                    displayValue: weightDisplay,
                    useLbs: viewModel.activeProfile.useLbsWeight
                ),
                value: $weightDisplay,
                in: viewModel.activeProfile.useLbsWeight ? 80...400 : 35...180,
                step: viewModel.activeProfile.useLbsWeight ? 1 : 0.5
            )
            .onChange(of: weightDisplay) { _, newValue in
                viewModel.updateActiveProfile { draft in
                    draft.weightKg = viewModel.activeProfile.useLbsWeight
                        ? UnitFormatters.lbsToKg(newValue)
                        : newValue
                }
            }
        }
        .task {
            syncHeightFromProfile(useImperial: viewModel.activeProfile.useImperialHeight)
            syncWeightFromProfile(useLbs: viewModel.activeProfile.useLbsWeight)
        }
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
        viewModel.updateActiveProfile { draft in
            draft.heightCm = UnitFormatters.feetInchesToCm(feet: heightFeet, inches: heightInches)
        }
    }
}

#Preview {
    ProfileSetupStepView(viewModel: OnboardingViewModel(
        healthKitService: HealthKitService(),
        geminiService: GeminiService(),
        userProfileRepository: UserProfileRepository()
    ))
}
