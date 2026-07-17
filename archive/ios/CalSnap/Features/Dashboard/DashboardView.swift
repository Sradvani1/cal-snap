import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(AppContainer.self) private var appContainer
    @Environment(\.modelContext) private var modelContext
    @AppStorage(AppStorageKey.profileDataRevision) private var profileDataRevision = 0
    @State private var viewModel: DashboardViewModel?
    @State private var navigationPath: [DashboardRoute] = []
    @State private var mealPendingDeleteId: UUID?
    @State private var showDeleteConfirmation = false
    @State private var weighInSheetContext: WeighInSheetContext?
    @State private var weightProgressReloadTrigger = 0
    @State private var mealDetailReloadToken = 0
    @State private var didWireNotifications = false

    var body: some View {
        Group {
            if let viewModel {
                DashboardContentView(
                    viewModel: viewModel,
                    navigationPath: $navigationPath,
                    weighInSheetContext: $weighInSheetContext,
                    weightProgressReloadTrigger: weightProgressReloadTrigger,
                    mealDetailReloadToken: mealDetailReloadToken,
                    onReload: reloadDashboard,
                    onDeleteMeal: { meal in
                        mealPendingDeleteId = meal.id
                        showDeleteConfirmation = true
                    },
                    onWeighInSheetDismissed: {
                        weightProgressReloadTrigger += 1
                    },
                    onWeighInSaved: scheduleReminderIfNeeded
                )
                .alert("dashboard.alert.deleteMeal.title", isPresented: $showDeleteConfirmation) {
                    Button("common.button.delete", role: .destructive) {
                        confirmDelete()
                    }
                    Button("common.button.cancel", role: .cancel) {
                        mealPendingDeleteId = nil
                    }
                } message: {
                    Text("dashboard.alert.deleteMeal.message")
                }
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil {
                viewModel = DashboardViewModel(
                    userProfileRepository: appContainer.userProfileRepository,
                    mealRepository: appContainer.mealRepository,
                    weighInRepository: appContainer.weighInRepository
                )
            }
            reloadDashboard()
            scheduleReminderIfNeeded()
            wireNotificationsIfNeeded()
        }
        .onChange(of: navigationPath.count) { oldCount, newCount in
            if newCount < oldCount {
                reloadDashboard()
            }
        }
        .onChange(of: profileDataRevision) { _, _ in
            reloadDashboard()
        }
    }

    private func confirmDelete() {
        guard let mealId = mealPendingDeleteId else { return }

        do {
            guard let meal = try appContainer.mealRepository.fetchMeal(id: mealId, context: modelContext) else {
                mealPendingDeleteId = nil
                reloadDashboard()
                return
            }

            try MealDeletionService.delete(
                meal: meal,
                mealRepository: appContainer.mealRepository,
                healthKitService: appContainer.healthKitService,
                context: modelContext
            )
            mealPendingDeleteId = nil
            let pathCountBefore = navigationPath.count
            navigationPath.removeRoutes(forMealId: mealId)
            if navigationPath.count == pathCountBefore {
                reloadDashboard()
            }
        } catch {
            viewModel?.loadError = error.localizedDescription
            mealPendingDeleteId = nil
        }
    }

    private func wireNotificationsIfNeeded() {
        guard !didWireNotifications, let vm = viewModel else { return }
        didWireNotifications = true
        let coordinator = appContainer.navigationCoordinator
        appContainer.notificationManager.onWeighInReminderTapped = { _ in
            presentWeighInSheet(using: vm)
        }
        appContainer.notificationManager.onDailyLogReminderTapped = {
            coordinator.openMealScanner()
        }
        if appContainer.notificationManager.consumePendingWeighInRequest() != nil {
            presentWeighInSheet(using: vm)
        }
        if appContainer.notificationManager.consumePendingScannerOpen() {
            coordinator.openMealScanner()
        }
    }

    private func presentWeighInSheet(using viewModel: DashboardViewModel) {
        guard let profile = viewModel.activeProfile else { return }

        let currentWeight = viewModel.latestWeighInKg(for: profile.id, context: modelContext)
            ?? profile.startingWeightKg
        weighInSheetContext = WeighInSheetContext(
            id: profile.id,
            profile: profile,
            currentWeightKg: currentWeight,
            useLbs: viewModel.useLbsForDisplay
        )
    }

    private func reloadDashboard() {
        viewModel?.loadToday(context: modelContext)
        mealDetailReloadToken += 1
        syncWidgetIfNeeded()
    }

    private func syncWidgetIfNeeded() {
        guard let profile = viewModel?.activeProfile, let vm = viewModel else { return }
        WidgetSyncService.sync(
            profile: profile,
            dashboard: vm
        )
    }

    private func scheduleReminderIfNeeded() {
        guard let profile = viewModel?.activeProfile else { return }
        Task {
            await appContainer.notificationManager.scheduleWeighInReminder(
                userId: profile.id,
                name: profile.name
            )
            await appContainer.notificationManager.scheduleDailyLogReminder(
                userId: profile.id,
                displayName: profile.name
            )
        }
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
