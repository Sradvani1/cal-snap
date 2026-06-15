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
            Text("onboarding.profile.title")
                .font(.title2.bold())

            Picker("settings.profile.sex", selection: viewModel.binding(\.sex)) {
                Text("model.biologicalSex.male").tag(BiologicalSex.male)
                Text("model.biologicalSex.female").tag(BiologicalSex.female)
            }
            .pickerStyle(.segmented)

            DatePicker(
                "settings.profile.dateOfBirth",
                selection: viewModel.binding(\.dateOfBirth),
                in: dobRange,
                displayedComponents: .date
            )

            Toggle("onboarding.profile.useImperialHeight", isOn: viewModel.binding(\.useImperialHeight))
                .onChange(of: viewModel.profileDraft.useImperialHeight) { _, useImperial in
                    syncHeightFromProfile(useImperial: useImperial)
                }

            if viewModel.profileDraft.useImperialHeight {
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
                .onChange(of: heightFeet) { _, _ in updateHeightCm() }
                .onChange(of: heightInches) { _, _ in updateHeightCm() }
            } else {
                Stepper(
                    String(format: String(localized: "onboarding.profile.heightCm"), Int(viewModel.profileDraft.heightCm)),
                    value: viewModel.binding(\.heightCm),
                    in: 120...220,
                    step: 1
                )
            }

            Toggle("onboarding.profile.useLbsWeight", isOn: viewModel.binding(\.useLbsWeight))
                .onChange(of: viewModel.profileDraft.useLbsWeight) { _, useLbs in
                    syncWeightFromProfile(useLbs: useLbs)
                }

            Stepper(
                UnitFormatters.stepperWeightLabel(
                    displayValue: weightDisplay,
                    useLbs: viewModel.profileDraft.useLbsWeight
                ),
                value: $weightDisplay,
                in: viewModel.profileDraft.useLbsWeight ? 80...400 : 35...180,
                step: viewModel.profileDraft.useLbsWeight ? 1 : 0.5
            )
            .onChange(of: weightDisplay) { _, newValue in
                viewModel.updateProfileDraft { draft in
                    draft.weightKg = viewModel.profileDraft.useLbsWeight
                        ? UnitFormatters.lbsToKg(newValue)
                        : newValue
                }
            }
        }
        .task {
            syncHeightFromProfile(useImperial: viewModel.profileDraft.useImperialHeight)
            syncWeightFromProfile(useLbs: viewModel.profileDraft.useLbsWeight)
        }
    }

    private func syncHeightFromProfile(useImperial: Bool) {
        if useImperial {
            let parts = UnitFormatters.cmToFeetInches(viewModel.profileDraft.heightCm)
            heightFeet = parts.feet
            heightInches = parts.inches
        }
    }

    private func syncWeightFromProfile(useLbs: Bool) {
        weightDisplay = useLbs
            ? UnitFormatters.kgToLbs(viewModel.profileDraft.weightKg)
            : viewModel.profileDraft.weightKg
    }

    private func updateHeightCm() {
        viewModel.updateProfileDraft { draft in
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
