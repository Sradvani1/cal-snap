import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @AppStorage(AppStorageKey.activeUserId) private var activeUserId = ""
    @State private var viewModel: DashboardViewModel?
    @State private var showScanner = false
    @State private var suppressActiveUserIdReload = false

    var body: some View {
        Group {
            if let viewModel {
                dashboardContent(viewModel: viewModel)
            } else {
                ProgressView()
            }
        }
        .onAppear {
            if viewModel == nil {
                viewModel = DashboardViewModel(
                    userProfileRepository: appContainer.userProfileRepository,
                    mealRepository: appContainer.mealRepository,
                    weighInRepository: appContainer.weighInRepository
                )
            }
            reloadDashboard()
        }
        .onChange(of: activeUserId) { _, _ in
            guard !suppressActiveUserIdReload else {
                suppressActiveUserIdReload = false
                return
            }
            reloadDashboard()
        }
    }

    @ViewBuilder
    private func dashboardContent(viewModel: DashboardViewModel) -> some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(viewModel.greeting)
                                .font(.title2.bold())
                            Text(viewModel.formattedDate)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }

                        if let error = viewModel.loadError {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }

                        CalorieRingCard(
                            consumed: viewModel.todaysCalories,
                            target: viewModel.activeProfile?.dailyCalorieTarget ?? 2000,
                            remaining: viewModel.remainingCalories,
                            progress: viewModel.calorieProgress,
                            progressColor: viewModel.progressColor
                        )

                        MacroBarCard(
                            proteinConsumed: viewModel.todaysProteinG,
                            proteinTarget: viewModel.macroTargets.proteinG,
                            carbsConsumed: viewModel.todaysCarbsG,
                            carbsTarget: viewModel.macroTargets.carbsG,
                            fatConsumed: viewModel.todaysFatG,
                            fatTarget: viewModel.macroTargets.fatG,
                            fiberConsumed: viewModel.todaysFiberG,
                            fiberTarget: viewModel.fiberTargetG
                        )

                        TodaysMealsSection(meals: viewModel.todaysMeals)

                        WeightTrendMiniChart(
                            weighIns: viewModel.chartWeighIns,
                            startingWeightKg: viewModel.activeProfile?.startingWeightKg ?? 0,
                            useLbs: viewModel.useLbsForDisplay
                        )
                    }
                    .padding()
                    .padding(.bottom, 72)
                }

                Button {
                    showScanner = true
                } label: {
                    Image(systemName: "plus")
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                        .frame(width: 56, height: 56)
                        .background(Color.accentColor)
                        .clipShape(Circle())
                        .shadow(radius: 4, y: 2)
                }
                .padding()
                .accessibilityLabel("Add meal")
            }
            .navigationDestination(isPresented: $showScanner) {
                MealScannerView()
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileSwitcherView(
                        profiles: viewModel.profiles,
                        activeProfile: viewModel.activeProfile,
                        onSwitch: { profile in
                            activeUserId = profile.id.uuidString
                        }
                    )
                }
            }
            .sheet(isPresented: plateauAlertBinding(viewModel)) {
                PlateauAlertSheet(
                    onDietBreak: {
                        viewModel.applyDietBreak(context: modelContext)
                    },
                    onSmallReduction: {
                        viewModel.applySmallReduction(context: modelContext)
                    },
                    onDismiss: {
                        viewModel.dismissPlateauAlert()
                    }
                )
            }
        }
    }

    private func reloadDashboard() {
        viewModel?.loadToday(context: modelContext, activeUserId: activeUserId)
        syncActiveUserIdIfNeeded()
    }

    private func syncActiveUserIdIfNeeded() {
        guard activeUserId.isEmpty,
              let profileId = viewModel?.activeProfile?.id.uuidString else { return }
        suppressActiveUserIdReload = true
        activeUserId = profileId
    }

    private func plateauAlertBinding(_ viewModel: DashboardViewModel) -> Binding<Bool> {
        Binding(
            get: { viewModel.showPlateauAlert },
            set: { viewModel.showPlateauAlert = $0 }
        )
    }
}

#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(
        for: UserProfile.self, MealEntry.self, FoodItem.self, WeighIn.self,
        configurations: config
    )
    let profile = UserProfile(
        name: "Alex",
        dailyCalorieTarget: 2000,
        tdee: 2350,
        deficitKcal: 350
    )
    container.mainContext.insert(profile)

    return DashboardView()
        .environment(AppContainer())
        .modelContainer(container)
}