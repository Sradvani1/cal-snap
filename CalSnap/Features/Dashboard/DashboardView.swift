import SwiftUI
import SwiftData

private struct WeighInSheetContext: Identifiable {
    let id: UUID
    let profile: UserProfile
    let currentWeightKg: Double
    let useLbs: Bool
}

struct DashboardView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @AppStorage(AppStorageKey.activeUserId) private var activeUserId = ""
    @State private var viewModel: DashboardViewModel?
    @State private var navigationPath: [DashboardRoute] = []
    @State private var suppressActiveUserIdReload = false
    @State private var mealPendingDelete: MealEntry?
    @State private var showDeleteConfirmation = false
    @State private var weighInSheetContext: WeighInSheetContext?

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
            scheduleReminderIfNeeded()
            guard let vm = viewModel else { return }
            appContainer.notificationManager.onWeighInReminderTapped = {
                presentWeighInSheet(using: vm)
            }
            if appContainer.notificationManager.consumePendingWeighInSheet() {
                presentWeighInSheet(using: vm)
            }
        }
        .onChange(of: activeUserId) { _, _ in
            guard !suppressActiveUserIdReload else {
                suppressActiveUserIdReload = false
                return
            }
            navigationPath = []
            reloadDashboard()
            scheduleReminderIfNeeded()
        }
        .onChange(of: navigationPath.count) { oldCount, newCount in
            if newCount < oldCount {
                reloadDashboard()
            }
        }
    }

    @ViewBuilder
    private func dashboardContent(viewModel: DashboardViewModel) -> some View {
        NavigationStack(path: $navigationPath) {
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

                        MealListView(
                            meals: viewModel.todaysMeals,
                            onSelect: { meal in
                                navigationPath.append(.mealDetail(meal))
                            },
                            onEdit: { meal in
                                navigationPath.append(.mealScanner(.edit(meal)))
                            },
                            onDelete: { meal in
                                mealPendingDelete = meal
                                showDeleteConfirmation = true
                            },
                            onAdd: { mealType in
                                navigationPath.append(.mealScanner(.create(initialMealType: mealType)))
                            }
                        )

                        DailySummaryFooterView(
                            fiberConsumed: viewModel.todaysFiberG,
                            fiberTarget: viewModel.fiberTargetG,
                            fiberColor: viewModel.fiberProgressColor,
                            netCalorieSummary: viewModel.netCalorieSummary,
                            netCalorieDelta: viewModel.netCalorieDelta,
                            actualMacroPercents: viewModel.actualMacroPercents,
                            targetMacroPercents: viewModel.targetMacroPercents
                        )

                        WeightTrendMiniChart(
                            weighIns: viewModel.chartWeighIns,
                            startingWeightKg: viewModel.activeProfile?.startingWeightKg ?? 0,
                            useLbs: viewModel.useLbsForDisplay,
                            onTap: {
                                navigationPath.append(.weightProgress)
                            },
                            onLogWeighIn: {
                                presentWeighInSheet(using: viewModel)
                            }
                        )
                    }
                    .padding()
                    .padding(.bottom, 72)
                }

                Button {
                    navigationPath.append(.mealScanner(.create(initialMealType: nil)))
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
            .navigationDestination(for: DashboardRoute.self) { route in
                switch route {
                case .mealDetail(let meal):
                    MealDetailView(
                        meal: meal,
                        onMealChanged: { reloadDashboard() },
                        navigationPath: $navigationPath
                    )
                case .mealScanner(let scannerRoute):
                    MealScannerView(
                        activeUserId: activeUserId,
                        route: scannerRoute,
                        onMealSaved: { reloadDashboard() }
                    )
                case .weightProgress:
                    if let profile = viewModel.activeProfile {
                        WeightProgressView(
                            viewModel: WeightProgressViewModel(
                                profile: profile,
                                useLbs: viewModel.useLbsForDisplay,
                                weighInRepository: appContainer.weighInRepository
                            ),
                            showWeighInSheet: weighInSheetBinding(for: viewModel)
                        )
                    } else {
                        ContentUnavailableView("No profile", systemImage: "person.crop.circle")
                    }
                }
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
            .sheet(item: $weighInSheetContext) { context in
                WeighInView(
                    viewModel: WeighInViewModel(
                        profile: context.profile,
                        currentWeightKg: context.currentWeightKg,
                        useLbs: context.useLbs,
                        weighInRepository: appContainer.weighInRepository,
                        healthKitService: appContainer.healthKitService
                    ),
                    notificationManager: appContainer.notificationManager,
                    onSaved: { result in
                        reloadDashboard()
                        scheduleReminderIfNeeded()
                        if result.didTriggerPlateau {
                            viewModel.checkForPlateau()
                        }
                    },
                    onSkipped: {}
                )
            }
            .alert("Delete this meal?", isPresented: $showDeleteConfirmation) {
                Button("Delete", role: .destructive) {
                    confirmDelete()
                }
                Button("Cancel", role: .cancel) {
                    mealPendingDelete = nil
                }
            } message: {
                Text("This removes the meal from your log and reverses the HealthKit entry.")
            }
        }
    }

    private func confirmDelete() {
        guard let meal = mealPendingDelete else { return }

        do {
            try MealDeletionService.delete(
                meal: meal,
                mealRepository: appContainer.mealRepository,
                healthKitService: appContainer.healthKitService,
                context: modelContext
            )
            mealPendingDelete = nil
            reloadDashboard()
        } catch {
            viewModel?.loadError = error.localizedDescription
            mealPendingDelete = nil
        }
    }

    private func weighInSheetBinding(for viewModel: DashboardViewModel) -> Binding<Bool> {
        Binding(
            get: { weighInSheetContext != nil },
            set: { isPresented in
                if isPresented {
                    presentWeighInSheet(using: viewModel)
                } else {
                    weighInSheetContext = nil
                }
            }
        )
    }

    private func presentWeighInSheet(using viewModel: DashboardViewModel) {
        guard let profile = viewModel.activeProfile else { return }
        let currentWeight = viewModel.latestWeighInKg ?? profile.startingWeightKg
        weighInSheetContext = WeighInSheetContext(
            id: profile.id,
            profile: profile,
            currentWeightKg: currentWeight,
            useLbs: viewModel.useLbsForDisplay
        )
    }

    private func reloadDashboard() {
        viewModel?.loadToday(context: modelContext, activeUserId: activeUserId)
        syncActiveUserIdIfNeeded()
    }

    private func scheduleReminderIfNeeded() {
        guard let profiles = viewModel?.profiles, !profiles.isEmpty else { return }
        Task {
            for profile in profiles {
                await appContainer.notificationManager.scheduleWeighInReminder(
                    userId: profile.id,
                    name: profile.name
                )
            }
        }
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
